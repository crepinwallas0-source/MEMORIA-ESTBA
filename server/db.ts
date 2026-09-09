import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  academicYears,
  auditLogs,
  chapters,
  courses,
  favorites,
  institutions,
  levels,
  programs,
  resourceFiles,
  resourceReports,
  resources,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCatalog() {
  const db = await getDb();
  if (!db) return { institutions: [], programs: [], levels: [], academicYears: [], courses: [], chapters: [] };
  const [institutionRows, programRows, levelRows, yearRows, courseRows, chapterRows] = await Promise.all([
    db.select().from(institutions).where(eq(institutions.active, true)),
    db.select().from(programs).where(eq(programs.active, true)),
    db.select().from(levels).where(eq(levels.active, true)).orderBy(levels.sortOrder),
    db.select().from(academicYears).where(eq(academicYears.active, true)).orderBy(desc(academicYears.label)),
    db.select().from(courses).where(eq(courses.active, true)).orderBy(courses.name),
    db.select().from(chapters).where(eq(chapters.active, true)).orderBy(chapters.sortOrder),
  ]);
  return {
    institutions: institutionRows,
    programs: programRows,
    levels: levelRows,
    academicYears: yearRows,
    courses: courseRows,
    chapters: chapterRows,
  };
}

const resourceSelection = {
  id: resources.id,
  title: resources.title,
  description: resources.description,
  resourceType: resources.resourceType,
  status: resources.status,
  versionNumber: resources.versionNumber,
  teacherName: resources.teacherName,
  createdAt: resources.createdAt,
  publishedAt: resources.publishedAt,
  programId: resources.programId,
  levelId: resources.levelId,
  academicYearId: resources.academicYearId,
  courseId: resources.courseId,
  programCode: programs.code,
  programName: programs.name,
  levelLabel: levels.label,
  academicYearLabel: academicYears.label,
  courseName: courses.name,
  courseCode: courses.code,
  fileName: resourceFiles.fileName,
  fileUrl: resourceFiles.storageUrl,
  fileKey: resourceFiles.storageKey,
  fileVisibility: resourceFiles.visibility,
};

export async function listPublishedResources(input: {
  search?: string;
  programId?: number;
  levelId?: number;
  academicYearId?: number;
  courseId?: number;
  resourceType?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(resources.status, "published"), eq(resourceFiles.visibility, "public")];
  if (input.programId) filters.push(eq(resources.programId, input.programId));
  if (input.levelId) filters.push(eq(resources.levelId, input.levelId));
  if (input.academicYearId) filters.push(eq(resources.academicYearId, input.academicYearId));
  if (input.courseId) filters.push(eq(resources.courseId, input.courseId));
  if (input.resourceType) filters.push(eq(resources.resourceType, input.resourceType));
  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    filters.push(or(like(resources.title, term), like(resources.description, term), like(courses.name, term))!);
  }
  return db
    .select(resourceSelection)
    .from(resources)
    .innerJoin(programs, eq(resources.programId, programs.id))
    .innerJoin(levels, eq(resources.levelId, levels.id))
    .innerJoin(academicYears, eq(resources.academicYearId, academicYears.id))
    .innerJoin(courses, eq(resources.courseId, courses.id))
    .innerJoin(resourceFiles, eq(resourceFiles.resourceId, resources.id))
    .where(and(...filters))
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt));
}

export async function listPendingResources() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select(resourceSelection)
    .from(resources)
    .innerJoin(programs, eq(resources.programId, programs.id))
    .innerJoin(levels, eq(resources.levelId, levels.id))
    .innerJoin(academicYears, eq(resources.academicYearId, academicYears.id))
    .innerJoin(courses, eq(resources.courseId, courses.id))
    .innerJoin(resourceFiles, eq(resourceFiles.resourceId, resources.id))
    .where(eq(resources.status, "pending"))
    .orderBy(desc(resources.createdAt));
}

export async function listUserResources(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select(resourceSelection)
    .from(resources)
    .innerJoin(programs, eq(resources.programId, programs.id))
    .innerJoin(levels, eq(resources.levelId, levels.id))
    .innerJoin(academicYears, eq(resources.academicYearId, academicYears.id))
    .innerJoin(courses, eq(resources.courseId, courses.id))
    .innerJoin(resourceFiles, eq(resourceFiles.resourceId, resources.id))
    .where(eq(resources.creatorId, userId))
    .orderBy(desc(resources.createdAt));
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select(resourceSelection)
    .from(resources)
    .innerJoin(programs, eq(resources.programId, programs.id))
    .innerJoin(levels, eq(resources.levelId, levels.id))
    .innerJoin(academicYears, eq(resources.academicYearId, academicYears.id))
    .innerJoin(courses, eq(resources.courseId, courses.id))
    .innerJoin(resourceFiles, eq(resourceFiles.resourceId, resources.id))
    .where(eq(resources.id, id))
    .limit(1);
  return rows[0];
}

export async function getResourceStats() {
  const db = await getDb();
  if (!db) return { published: 0, pending: 0, students: 0, reports: 0 };
  const [published, pending, students, reports] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(resources).where(eq(resources.status, "published")),
    db.select({ count: sql<number>`count(*)` }).from(resources).where(eq(resources.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "user")),
    db.select({ count: sql<number>`count(*)` }).from(resourceReports).where(eq(resourceReports.status, "open")),
  ]);
  return {
    published: Number(published[0]?.count ?? 0),
    pending: Number(pending[0]?.count ?? 0),
    students: Number(students[0]?.count ?? 0),
    reports: Number(reports[0]?.count ?? 0),
  };
}

export async function addAuditLog(actorId: number, action: string, entityType: string, entityId?: number, metadata?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });
}

export { academicYears, chapters, courses, favorites, institutions, levels, programs, resourceFiles, resourceReports, resources };
