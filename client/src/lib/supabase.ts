import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Profile = { id: string; full_name: string | null; role: "student" | "admin" };
export type Catalog = {
  institutions: any[];
  programs: any[];
  levels: any[];
  academicYears: any[];
  courses: any[];
};

export async function getCatalog(): Promise<Catalog> {
  const [institutions, programs, levels, academicYears, courses] = await Promise.all([
    supabase.from("institutions").select("id,name,short_name,description").eq("active", true),
    supabase.from("programs").select("id,institution_id,code,name,description").eq("active", true).order("code"),
    supabase.from("levels").select("id,label,sort_order").eq("active", true).order("sort_order"),
    supabase.from("academic_years").select("id,label").eq("active", true).order("label", { ascending: false }),
    supabase.from("courses").select("id,institution_id,program_id,level_id,academic_year_id,code,name,teacher_name").eq("active", true).order("name"),
  ]);
  const error = institutions.error || programs.error || levels.error || academicYears.error || courses.error;
  if (error) throw error;
  return { institutions: institutions.data ?? [], programs: programs.data ?? [], levels: levels.data ?? [], academicYears: academicYears.data ?? [], courses: courses.data ?? [] };
}

function normalizeResource(row: any) {
  const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
  const level = Array.isArray(row.levels) ? row.levels[0] : row.levels;
  const year = Array.isArray(row.academic_years) ? row.academic_years[0] : row.academic_years;
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  const file = Array.isArray(row.resource_files) ? row.resource_files[0] : row.resource_files;
  return { ...row, programCode: program?.code, programName: program?.name, levelLabel: level?.label, academicYearLabel: year?.label, courseName: course?.name, courseCode: course?.code, filePath: file?.storage_path, fileName: file?.file_name, fileType: file?.mime_type, fileVisibility: file?.visibility };
}

export async function listPublishedResources(filters: { search?: string; programId?: number; levelId?: number; academicYearId?: number; courseId?: number; resourceType?: string }) {
  let query = supabase.from("resources").select("id,title,description,resource_type,status,version_number,teacher_name,created_at,published_at,program_id,level_id,academic_year_id,course_id,programs(code,name),levels(label),academic_years(label),courses(name,code),resource_files(storage_path,file_name,mime_type,visibility)").eq("status", "published").order("published_at", { ascending: false });
  if (filters.programId) query = query.eq("program_id", filters.programId);
  if (filters.levelId) query = query.eq("level_id", filters.levelId);
  if (filters.academicYearId) query = query.eq("academic_year_id", filters.academicYearId);
  if (filters.courseId) query = query.eq("course_id", filters.courseId);
  if (filters.resourceType) query = query.eq("resource_type", filters.resourceType);
  if (filters.search?.trim()) query = query.or(`title.ilike.%${filters.search.trim()}%,description.ilike.%${filters.search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeResource);
}

export async function listPendingResources() {
  const { data, error } = await supabase.from("resources").select("id,title,description,resource_type,status,version_number,teacher_name,created_at,published_at,programs(code,name),levels(label),academic_years(label),courses(name,code),resource_files(storage_path,file_name,mime_type,visibility)").eq("status", "pending").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeResource);
}

export async function listMine(userId: string) {
  const { data, error } = await supabase.from("resources").select("id,title,description,resource_type,status,version_number,teacher_name,created_at,published_at,programs(code,name),levels(label),academic_years(label),courses(name,code),resource_files(storage_path,file_name,mime_type,visibility)").eq("creator_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizeResource);
}

export async function getSignedResourceUrl(path: string) {
  const { data, error } = await supabase.storage.from("resources").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function submitResource(input: { userId: string; institutionId: number; programId: number; levelId: number; academicYearId: number; courseId: number; title: string; description?: string; resourceType: string; teacherName?: string; file: File }) {
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `pending/${input.userId}/${crypto.randomUUID()}-${safeName}`;
  const uploaded = await supabase.storage.from("resources").upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (uploaded.error) throw uploaded.error;
  const resource = await supabase.from("resources").insert({ creator_id: input.userId, institution_id: input.institutionId, program_id: input.programId, level_id: input.levelId, academic_year_id: input.academicYearId, course_id: input.courseId, title: input.title, description: input.description || null, resource_type: input.resourceType, teacher_name: input.teacherName || null }).select("id").single();
  if (resource.error) throw resource.error;
  const fileRow = await supabase.from("resource_files").insert({ resource_id: resource.data.id, storage_path: path, file_name: input.file.name, mime_type: input.file.type, file_size: input.file.size, visibility: "private" });
  if (fileRow.error) throw fileRow.error;
}

export async function getStats() {
  const [published, pending, reports] = await Promise.all([
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("resource_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return { published: published.count ?? 0, pending: pending.count ?? 0, reports: reports.count ?? 0 };
}

export async function publishResource(resourceId: number, path: string) {
  const target = path.replace(/^pending\//, "published/");
  const moved = await supabase.storage.from("resources").move(path, target);
  if (moved.error) throw moved.error;
  const updated = await supabase.from("resources").update({ status: "published", published_at: new Date().toISOString(), rejection_reason: null }).eq("id", resourceId);
  if (updated.error) throw updated.error;
  const fileUpdate = await supabase.from("resource_files").update({ storage_path: target, visibility: "public" }).eq("resource_id", resourceId);
  if (fileUpdate.error) throw fileUpdate.error;
}

export async function rejectResource(resourceId: number, reason: string) {
  const { error } = await supabase.from("resources").update({ status: "rejected", rejection_reason: reason }).eq("id", resourceId);
  if (error) throw error;
}
