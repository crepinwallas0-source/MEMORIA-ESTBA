import {
  boolean,
  int,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const institutions = mysqlTable("institutions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  shortName: varchar("shortName", { length: 32 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const programs = mysqlTable(
  "programs",
  {
    id: int("id").autoincrement().primaryKey(),
    institutionId: int("institutionId").notNull().references(() => institutions.id),
    code: varchar("code", { length: 16 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    institutionCode: uniqueIndex("programs_institution_code_idx").on(table.institutionId, table.code),
  }),
);

export const levels = mysqlTable("levels", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 80 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const academicYears = mysqlTable("academic_years", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 32 }).notNull().unique(),
  active: boolean("active").default(true).notNull(),
});

export const courses = mysqlTable(
  "courses",
  {
    id: int("id").autoincrement().primaryKey(),
    institutionId: int("institutionId").notNull().references(() => institutions.id),
    programId: int("programId").notNull().references(() => programs.id),
    levelId: int("levelId").notNull().references(() => levels.id),
    academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
    code: varchar("code", { length: 32 }),
    name: varchar("name", { length: 180 }).notNull(),
    teacherName: varchar("teacherName", { length: 180 }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    contextIdx: index("courses_context_idx").on(
      table.programId,
      table.levelId,
      table.academicYearId,
    ),
  }),
);

export const chapters = mysqlTable(
  "chapters",
  {
    id: int("id").autoincrement().primaryKey(),
    courseId: int("courseId").notNull().references(() => courses.id),
    title: varchar("title", { length: 220 }).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
  },
  table => ({
    courseIdx: index("chapters_course_idx").on(table.courseId),
  }),
);

export const resources = mysqlTable(
  "resources",
  {
    id: int("id").autoincrement().primaryKey(),
    creatorId: int("creatorId").notNull().references(() => users.id),
    institutionId: int("institutionId").notNull().references(() => institutions.id),
    programId: int("programId").notNull().references(() => programs.id),
    levelId: int("levelId").notNull().references(() => levels.id),
    academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
    courseId: int("courseId").notNull().references(() => courses.id),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    resourceType: varchar("resourceType", { length: 64 }).notNull(),
    teacherName: varchar("teacherName", { length: 180 }),
    status: mysqlEnum("status", ["draft", "pending", "published", "rejected", "blocked", "archived"]).default("pending").notNull(),
    rejectionReason: text("rejectionReason"),
    versionNumber: int("versionNumber").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    publishedAt: timestamp("publishedAt"),
  },
  table => ({
    statusIdx: index("resources_status_idx").on(table.status),
    catalogIdx: index("resources_catalog_idx").on(
      table.programId,
      table.levelId,
      table.academicYearId,
      table.courseId,
    ),
  }),
);

export const resourceChapters = mysqlTable(
  "resource_chapters",
  {
    resourceId: int("resourceId").notNull().references(() => resources.id),
    chapterId: int("chapterId").notNull().references(() => chapters.id),
  },
  table => ({
    resourceChapterIdx: uniqueIndex("resource_chapter_idx").on(table.resourceId, table.chapterId),
  }),
);

export const resourceFiles = mysqlTable(
  "resource_files",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull().references(() => resources.id),
    storageKey: varchar("storageKey", { length: 500 }).notNull(),
    storageUrl: varchar("storageUrl", { length: 700 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    fileSize: int("fileSize"),
    visibility: mysqlEnum("visibility", ["private", "public"]).default("private").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    resourceIdx: index("resource_files_resource_idx").on(table.resourceId),
  }),
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    resourceId: int("resourceId").notNull().references(() => resources.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    userResourceIdx: uniqueIndex("favorites_user_resource_idx").on(table.userId, table.resourceId),
  }),
);

export const resourceReports = mysqlTable("resource_reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull().references(() => users.id),
  resourceId: int("resourceId").notNull().references(() => resources.id),
  reason: varchar("reason", { length: 80 }).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["open", "resolved", "dismissed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const resourceRequests = mysqlTable("resource_requests", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull().references(() => users.id),
  programId: int("programId").notNull().references(() => programs.id),
  levelId: int("levelId").notNull().references(() => levels.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  courseId: int("courseId").notNull().references(() => courses.id),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["open", "fulfilled", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull().references(() => users.id),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;
export type ResourceFile = typeof resourceFiles.$inferSelect;
