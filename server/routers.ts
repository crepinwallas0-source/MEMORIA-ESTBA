import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import {
  addAuditLog,
  courses,
  favorites,
  getCatalog,
  getDb,
  getResourceById,
  getResourceStats,
  listPendingResources,
  listPublishedResources,
  listUserResources,
  resourceFiles,
  resourceReports,
  resources,
} from "./db";

const resourceStatusSchema = z.enum(["published", "rejected", "blocked", "archived"]);
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
];

const resourceInputSchema = z.object({
  institutionId: z.number().positive(),
  programId: z.number().positive(),
  levelId: z.number().positive(),
  academicYearId: z.number().positive(),
  courseId: z.number().positive(),
  title: z.string().min(3).max(240),
  description: z.string().max(3000).optional(),
  resourceType: z.string().min(2).max(64),
  teacherName: z.string().max(180).optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().refine(value => allowedMimeTypes.includes(value), "Type de fichier non autorisé"),
  fileSize: z.number().positive().max(25 * 1024 * 1024),
  fileBase64: z.string().min(10),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    get: publicProcedure.query(() => getCatalog()),
  }),
  resources: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        programId: z.number().optional(),
        levelId: z.number().optional(),
        academicYearId: z.number().optional(),
        courseId: z.number().optional(),
        resourceType: z.string().optional(),
      }).optional())
      .query(({ input }) => listPublishedResources(input ?? {})),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getResourceById(input.id)),
    mine: protectedProcedure.query(({ ctx }) => listUserResources(ctx.user.id)),
    submit: protectedProcedure.input(resourceInputSchema).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storageKey = `resources/pending/${ctx.user.id}/${Date.now()}-${safeFileName}`;
      const stored = await storagePut(storageKey, Buffer.from(input.fileBase64, "base64"), input.mimeType);
      const inserted = await db.insert(resources).values({
        creatorId: ctx.user.id,
        institutionId: input.institutionId,
        programId: input.programId,
        levelId: input.levelId,
        academicYearId: input.academicYearId,
        courseId: input.courseId,
        title: input.title,
        description: input.description,
        resourceType: input.resourceType,
        teacherName: input.teacherName,
        status: "pending",
      });
      const resourceId = Number(inserted[0].insertId);
      await db.insert(resourceFiles).values({
        resourceId,
        storageKey: stored.key,
        storageUrl: stored.url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        visibility: "private",
      });
      await addAuditLog(ctx.user.id, "resource.submitted", "resource", resourceId, { fileName: input.fileName });
      return { success: true, resourceId };
    }),
    favorite: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        const existing = await db.select().from(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.resourceId, input.resourceId))).limit(1);
        if (existing[0]) {
          await db.delete(favorites).where(eq(favorites.id, existing[0].id));
          return { favorited: false };
        }
        await db.insert(favorites).values({ userId: ctx.user.id, resourceId: input.resourceId });
        return { favorited: true };
      }),
    report: protectedProcedure
      .input(z.object({ resourceId: z.number(), reason: z.string().min(2).max(80), details: z.string().max(1000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        await db.insert(resourceReports).values({ reporterId: ctx.user.id, ...input });
        await addAuditLog(ctx.user.id, "resource.reported", "resource", input.resourceId, { reason: input.reason });
        return { success: true };
      }),
  }),
  admin: router({
    stats: adminProcedure.query(() => getResourceStats()),
    pending: adminProcedure.query(() => listPendingResources()),
    createCourse: adminProcedure
      .input(z.object({
        institutionId: z.number().positive(),
        programId: z.number().positive(),
        levelId: z.number().positive(),
        academicYearId: z.number().positive(),
        code: z.string().max(32).optional(),
        name: z.string().min(2).max(180),
        teacherName: z.string().max(180).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        const result = await db.insert(courses).values({ ...input });
        await addAuditLog(ctx.user.id, "course.created", "course", Number(result[0].insertId), { name: input.name });
        return { success: true };
      }),
    setStatus: adminProcedure
      .input(z.object({ resourceId: z.number(), status: resourceStatusSchema, rejectionReason: z.string().max(1000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        await db.update(resources).set({
          status: input.status,
          rejectionReason: input.status === "rejected" ? input.rejectionReason ?? "Non précisé" : null,
          publishedAt: input.status === "published" ? new Date() : undefined,
        }).where(eq(resources.id, input.resourceId));
        if (input.status === "published") {
          await db.update(resourceFiles).set({ visibility: "public" }).where(eq(resourceFiles.resourceId, input.resourceId));
        }
        await addAuditLog(ctx.user.id, `resource.${input.status}`, "resource", input.resourceId, { rejectionReason: input.rejectionReason });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
