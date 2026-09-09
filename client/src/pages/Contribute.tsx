import { CheckCircle2, FileUp, Info, LockKeyhole, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const resourceTypes = [
  ["cours", "Cours"], ["td", "TD"], ["tp", "TP"], ["examen", "Examen"], ["corrige", "Corrigé"], ["fiche", "Fiche de révision"], ["rapport", "Rapport de stage"], ["officiel", "Document officiel"], ["autre", "Autre"],
];

export default function Contribute() {
  const { isAuthenticated, loading } = useAuth();
  const catalog = trpc.catalog.get.useQuery();
  const submit = trpc.resources.submit.useMutation();
  const [programId, setProgramId] = useState<number>();
  const [levelId, setLevelId] = useState<number>();
  const [academicYearId, setAcademicYearId] = useState<number>();
  const [courseId, setCourseId] = useState<number>();
  const [resourceType, setResourceType] = useState("cours");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", description: "", teacherName: "" });

  useEffect(() => {
    if (!catalog.data) return;
    setProgramId(value => value ?? catalog.data?.programs[0]?.id);
    setLevelId(value => value ?? catalog.data?.levels[0]?.id);
    setAcademicYearId(value => value ?? catalog.data?.academicYears[0]?.id);
  }, [catalog.data]);

  const courses = useMemo(() => catalog.data?.courses.filter(course => (!programId || course.programId === programId) && (!levelId || course.levelId === levelId) && (!academicYearId || course.academicYearId === academicYearId)) ?? [], [catalog.data, programId, levelId, academicYearId]);
  useEffect(() => { if (courses.length && !courses.some(course => course.id === courseId)) setCourseId(courses[0].id); }, [courses, courseId]);

  if (loading) return <AppShell><div className="container py-24 text-center text-[#6c8177]">Chargement de votre espace…</div></AppShell>;
  if (!isAuthenticated) return <AppShell><div className="container py-24"><div className="mx-auto max-w-lg rounded-[2rem] border border-[#dce8df] bg-white p-8 text-center shadow-xl shadow-[#18332e]/5"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e0f0e5] text-[#0f4c45]"><LockKeyhole size={25} /></div><h1 className="mt-5 font-display text-3xl font-bold text-[#0f4c45]">Contribuer à MEMORIA</h1><p className="mt-3 text-sm leading-6 text-[#6c8177]">Connectez-vous pour déposer un document et le transmettre aux prochaines générations.</p><Button onClick={startLogin} className="mt-6 rounded-full bg-[#0f4c45] text-white hover:bg-[#0a3b36]">Se connecter</Button></div></div></AppShell>;

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !programId || !levelId || !academicYearId || !courseId) { toast.error("Complétez le contexte académique et choisissez un fichier"); return; }
    if (file.size > 25 * 1024 * 1024) { toast.error("Le fichier doit peser moins de 25 Mo"); return; }
    const fileBase64 = await toBase64(file);
    try {
      await submit.mutateAsync({ institutionId: catalog.data?.institutions[0]?.id ?? 1, programId, levelId, academicYearId, courseId, resourceType, title: form.title, description: form.description || undefined, teacherName: form.teacherName || undefined, fileName: file.name, mimeType: file.type || "application/pdf", fileSize: file.size, fileBase64 });
      toast.success("Ressource envoyée. Elle sera examinée avant publication.");
      setForm({ title: "", description: "", teacherName: "" });
      setFile(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Impossible d'envoyer la ressource"); }
  };

  return <AppShell><section className="border-b border-[#dce8df] bg-[#e8f1e7]"><div className="container py-12"><div className="max-w-2xl"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c87536]"><UploadCloud size={15} />Contribution étudiante</div><h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#0f4c45]">Transmettre une ressource</h1><p className="mt-3 text-sm leading-6 text-[#5f766b]">Chaque dépôt est rattaché à son contexte et reste privé jusqu'à sa validation par l'administration.</p></div></div></section><section className="container py-10"><form onSubmit={submitForm} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-6"><div className="rounded-2xl border border-[#dce8df] bg-white p-6"><div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e0f0e5] text-[#0f4c45]">01</div><div><h2 className="font-display text-xl font-bold text-[#0f4c45]">Décrire le document</h2><p className="text-xs text-[#7b9288]">Les informations qui aideront à le retrouver.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-semibold text-[#3f5a4e]">Titre du document<Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex. Cours de biochimie — métabolisme" className="mt-2 h-11 border-[#dce8df]" /></label><label className="text-sm font-semibold text-[#3f5a4e]">Type<select required value={resourceType} onChange={e => setResourceType(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#dce8df] bg-white px-3 text-sm font-normal"><option value="">Choisir</option>{resourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-semibold text-[#3f5a4e]">Enseignant (facultatif)<Input value={form.teacherName} onChange={e => setForm({ ...form, teacherName: e.target.value })} placeholder="Nom de l'enseignant" className="mt-2 h-11 border-[#dce8df]" /></label><label className="sm:col-span-2 text-sm font-semibold text-[#3f5a4e]">Description (facultatif)<Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Quelques mots sur le contenu ou le contexte…" className="mt-2 min-h-24 border-[#dce8df]" /></label></div></div><div className="rounded-2xl border border-[#dce8df] bg-white p-6"><div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0d8] text-[#8b5319]">02</div><div><h2 className="font-display text-xl font-bold text-[#0f4c45]">Rattacher au programme</h2><p className="text-xs text-[#7b9288]">Conservez le chemin académique exact.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><SelectField label="Filière" value={programId} onChange={setProgramId} options={catalog.data?.programs.map(p => ({ id: p.id, label: `${p.code} — ${p.name}` })) ?? []} /><SelectField label="Niveau" value={levelId} onChange={setLevelId} options={catalog.data?.levels.map(p => ({ id: p.id, label: p.label })) ?? []} /><SelectField label="Année académique" value={academicYearId} onChange={setAcademicYearId} options={catalog.data?.academicYears.map(p => ({ id: p.id, label: p.label })) ?? []} /><SelectField label="UE" value={courseId} onChange={setCourseId} options={courses.map(p => ({ id: p.id, label: p.name }))} /></div></div><div className="rounded-2xl border border-[#dce8df] bg-white p-6"><div className="mb-5 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7e1f5] text-[#5f4a8d]">03</div><div><h2 className="font-display text-xl font-bold text-[#0f4c45]">Joindre le fichier</h2><p className="text-xs text-[#7b9288]">PDF, document ou présentation · 25 Mo maximum.</p></div></div><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c5d9ca] bg-[#f8fbf7] p-6 text-center transition hover:border-[#8ab694] hover:bg-[#f1f8f1]"><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} />{file ? <><CheckCircle2 className="text-[#5c9664]" size={28} /><span className="mt-3 text-sm font-bold text-[#0f4c45]">{file.name}</span><span className="mt-1 text-xs text-[#7b9288]">{formatBytes(file.size)} · Cliquer pour remplacer</span></> : <><FileUp className="text-[#7b9288]" size={28} /><span className="mt-3 text-sm font-bold text-[#0f4c45]">Choisir un fichier</span><span className="mt-1 text-xs text-[#7b9288]">Le fichier original restera privé jusqu'à validation.</span></>}</label></div><Button type="submit" disabled={submit.isPending} className="h-12 w-full rounded-full bg-[#0f4c45] text-white hover:bg-[#0a3b36]">{submit.isPending ? "Envoi en cours…" : "Envoyer pour validation"}<UploadCloud size={17} /></Button></div><aside className="h-fit rounded-2xl border border-[#dce8df] bg-[#f0f7ef] p-5"><div className="flex items-start gap-3"><Info size={18} className="mt-0.5 shrink-0 text-[#0f4c45]" /><div><h3 className="font-display font-bold text-[#0f4c45]">Avant d'envoyer</h3><ul className="mt-3 space-y-3 text-xs leading-5 text-[#5f766b]"><li>• Vérifiez que le titre et le contexte sont exacts.</li><li>• Ne déposez pas de données personnelles ou confidentielles sans autorisation.</li><li>• Les rapports de stage originaux ne sont jamais publiés automatiquement.</li><li>• Une contribution sera visible après contrôle administratif.</li></ul></div></div><div className="mt-5 rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-[#6c8177]"><LockKeyhole size={14} className="mb-1 text-[#0f4c45]" />Votre fichier est stocké dans un espace privé pendant la validation.</div></aside></form></section></AppShell>;
}

function SelectField({ label, value, onChange, options }: { label: string; value?: number; onChange: (value: number | undefined) => void; options: { id: number; label: string }[] }) { return <label className="text-sm font-semibold text-[#3f5a4e]">{label}<select required value={value ?? ""} onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)} className="mt-2 h-11 w-full rounded-md border border-[#dce8df] bg-white px-3 text-sm font-normal"><option value="">Choisir</option>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>; }
function toBase64(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(file); }); }
function formatBytes(bytes: number) { if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`; return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`; }
