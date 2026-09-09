import { AlertCircle, Check, ClipboardList, FileText, LayoutDashboard, Loader2, Plus, ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const catalog = trpc.catalog.get.useQuery();
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const pending = trpc.admin.pending.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const setStatus = trpc.admin.setStatus.useMutation({ onSuccess: () => { toast.success("Décision enregistrée"); void pending.refetch(); void stats.refetch(); } });
  const createCourse = trpc.admin.createCourse.useMutation({ onSuccess: () => { toast.success("UE ajoutée au référentiel"); void catalog.refetch(); setCourseName(""); setCourseCode(""); } });
  const [programId, setProgramId] = useState<number>();
  const [levelId, setLevelId] = useState<number>();
  const [academicYearId, setAcademicYearId] = useState<number>();
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");

  useEffect(() => {
    if (!catalog.data) return;
    setProgramId(value => value ?? catalog.data?.programs[0]?.id);
    setLevelId(value => value ?? catalog.data?.levels[0]?.id);
    setAcademicYearId(value => value ?? catalog.data?.academicYears[0]?.id);
  }, [catalog.data]);

  if (loading) return <AppShell><div className="container py-24 text-center text-[#6c8177]">Chargement de votre espace…</div></AppShell>;
  if (!isAuthenticated) return <AppShell><Gate title="Administration protégée" message="Connectez-vous avec votre compte administrateur pour accéder à la modération." action="Se connecter" onClick={startLogin} /></AppShell>;
  if (user?.role !== "admin") return <AppShell><Gate title="Accès restreint" message="Cette section est réservée à l'administrateur de MEMORIA." action="Retour à la bibliothèque" onClick={() => { window.location.href = "/bibliotheque"; }} /></AppShell>;

  const submitCourse = (event: React.FormEvent) => {
    event.preventDefault();
    const institutionId = catalog.data?.institutions[0]?.id;
    if (!institutionId || !programId || !levelId || !academicYearId || !courseName.trim()) { toast.error("Complétez le nom de l'UE et son contexte"); return; }
    createCourse.mutate({ institutionId, programId, levelId, academicYearId, name: courseName.trim(), code: courseCode.trim() || undefined });
  };

  return <AppShell>
    <section className="border-b border-[#dce8df] bg-[#f8f0e2]"><div className="container py-10"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8b5319]"><LayoutDashboard size={15} />Centre de pilotage</div><h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#0f4c45]">Administration</h1><p className="mt-3 text-sm text-[#6c8177]">Traitez ce qui nécessite votre attention, sans perdre le contexte des contributions.</p></div></section>
    <section className="container py-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="En attente" value={stats.data?.pending ?? 0} icon={<ClipboardList size={18} />} accent="amber" /><StatCard label="Publiées" value={stats.data?.published ?? 0} icon={<Check size={18} />} accent="green" /><StatCard label="Étudiants" value={stats.data?.students ?? 0} icon={<Users size={18} />} accent="purple" /><StatCard label="Signalements ouverts" value={stats.data?.reports ?? 0} icon={<AlertCircle size={18} />} accent="red" /></div>
      <div className="mt-8 rounded-2xl border border-[#dce8df] bg-white p-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0f0e5] text-[#0f4c45]"><Plus size={17} /></div><div><h2 className="font-display text-lg font-bold text-[#0f4c45]">Renseigner une UE officielle</h2><p className="text-xs text-[#7b9288]">Les appellations doivent correspondre aux documents de l’établissement.</p></div></div><form onSubmit={submitCourse} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Input value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="Code (facultatif)" className="border-[#dce8df]" /><Input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Nom officiel de l’UE" className="border-[#dce8df] lg:col-span-2" /><Select label="Filière" value={programId} onChange={setProgramId} options={catalog.data?.programs.map(p => ({ id: p.id, label: p.code })) ?? []} /><Select label="Niveau" value={levelId} onChange={setLevelId} options={catalog.data?.levels.map(p => ({ id: p.id, label: p.label })) ?? []} /><Select label="Année" value={academicYearId} onChange={setAcademicYearId} options={catalog.data?.academicYears.map(p => ({ id: p.id, label: p.label })) ?? []} /><Button type="submit" disabled={createCourse.isPending} className="rounded-full bg-[#0f4c45] text-white hover:bg-[#0a3b36] sm:col-span-2 lg:col-span-1"><Plus size={15} />Ajouter</Button></form></div>
      <div className="mt-10 flex items-center justify-between"><div><div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c87536]">À traiter</div><h2 className="mt-1 font-display text-2xl font-bold text-[#0f4c45]">Ressources en attente</h2></div><Badge className="border-0 bg-[#f8e6c8] text-[#8b5319]">{pending.data?.length ?? 0} dossiers</Badge></div>
      <div className="mt-5 space-y-3">{pending.isLoading ? <div className="flex items-center justify-center rounded-2xl border border-[#dce8df] bg-white p-12 text-[#7b9288]"><Loader2 className="mr-2 animate-spin" size={18} />Chargement…</div> : pending.data?.map(resource => <article key={resource.id} className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f8e6c8] text-[#8b5319]"><FileText size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-[#fff5e8] text-[#8b5319]">{resource.resourceType}</Badge><span className="text-xs text-[#9aada3]">Soumis le {new Date(resource.createdAt).toLocaleDateString("fr-FR")}</span></div><h3 className="mt-1 truncate font-display text-lg font-bold text-[#18332e]">{resource.title}</h3><div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-[#6c8177]"><span>{resource.programCode}</span><span>·</span><span>{resource.levelLabel}</span><span>·</span><span>{resource.academicYearLabel}</span><span>·</span><span>{resource.courseName}</span></div><p className="mt-2 line-clamp-2 text-sm text-[#71877d]">{resource.description || "Aucune description."}</p></div></div><div className="flex shrink-0 flex-wrap gap-2 lg:justify-end"><a href={resource.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#cfe0d5] bg-white px-4 text-sm font-semibold text-[#0f4c45] hover:bg-[#edf5ee]"><FileText size={15} />Inspecter</a><Button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ resourceId: resource.id, status: "published" })} className="h-10 rounded-full bg-[#0f4c45] text-white hover:bg-[#0a3b36]"><Check size={15} />Publier</Button><Button disabled={setStatus.isPending} onClick={() => { const reason = window.prompt("Motif du rejet"); if (reason) setStatus.mutate({ resourceId: resource.id, status: "rejected", rejectionReason: reason }); }} variant="outline" className="h-10 rounded-full border-[#e7c6bd] bg-white text-[#a94c38] hover:bg-[#fff2ee]"><X size={15} />Rejeter</Button></div></div></article>)}{!pending.isLoading && !pending.data?.length && <div className="rounded-2xl border border-dashed border-[#c6d9ca] bg-white/70 p-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f0e5] text-[#0f4c45]"><ShieldCheck size={22} /></div><h3 className="mt-4 font-display text-xl font-bold text-[#0f4c45]">Tout est à jour</h3><p className="mt-2 text-sm text-[#6c8177]">Aucune ressource n'attend votre décision.</p></div>}</div>
    </section>
  </AppShell>;
}

function Gate({ title, message, action, onClick }: { title: string; message: string; action: string; onClick: () => void }) { return <div className="container py-24"><div className="mx-auto max-w-lg rounded-[2rem] border border-[#dce8df] bg-white p-8 text-center shadow-xl shadow-[#18332e]/5"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8e6c8] text-[#8b5319]"><ShieldCheck size={25} /></div><h1 className="mt-5 font-display text-3xl font-bold text-[#0f4c45]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#6c8177]">{message}</p><Button onClick={onClick} className="mt-6 rounded-full bg-[#0f4c45] text-white hover:bg-[#0a3b36]">{action}</Button></div></div>; }
function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: "amber" | "green" | "purple" | "red" }) { const styles = { amber: "bg-[#fff3df] text-[#9b611d]", green: "bg-[#e0f0e5] text-[#0f4c45]", purple: "bg-[#eae5f5] text-[#654e91]", red: "bg-[#fae5e0] text-[#a94c38]" }; return <div className="rounded-2xl border border-[#dce8df] bg-white p-5"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[accent]}`}>{icon}</div><div className="mt-4 font-display text-3xl font-bold text-[#18332e]">{value}</div><div className="mt-1 text-xs font-semibold text-[#7b9288]">{label}</div></div>; }
function Select({ label, value, onChange, options }: { label: string; value?: number; onChange: (value: number | undefined) => void; options: { id: number; label: string }[] }) { return <label className="text-xs font-semibold text-[#5d746a]">{label}<select required value={value ?? ""} onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)} className="mt-1 h-10 w-full rounded-md border border-[#dce8df] bg-white px-2 text-sm font-normal"><option value="">Choisir</option>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>; }
