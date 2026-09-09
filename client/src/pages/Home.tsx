import { ArrowRight, BookMarked, FileCheck2, HeartHandshake, LibraryBig, Search, ShieldCheck, UploadCloud } from "lucide-react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

const tracks = [
  { code: "AMB", name: "Analyses Médicales et Biologiques", color: "bg-[#e0f0e5] text-[#0f4c45]" },
  { code: "NHD", name: "Nutrition Humaine et Diététique", color: "bg-[#fff0d8] text-[#8b5319]" },
  { code: "IAA", name: "Industries Agroalimentaires", color: "bg-[#e7e1f5] text-[#5f4a8d]" },
  { code: "GEE", name: "Gestion de l'Eau et de l'Environnement", color: "bg-[#dcecf3] text-[#2d6075]" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const catalog = trpc.catalog.get.useQuery();

  return (
    <AppShell>
      <section className="relative overflow-hidden border-b border-[#dce8df] bg-[#e8f1e7]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#c9dfc9] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#f5d7a9] opacity-50 blur-3xl" />
        <div className="container relative grid gap-12 py-16 md:grid-cols-[1.1fr_.9fr] md:items-center md:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#bbd6c1] bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#0f4c45]">
              <span className="h-2 w-2 rounded-full bg-[#d88a3c]" />
              Le patrimoine académique de l'ESTBA
            </div>
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[#0f4c45] sm:text-6xl md:text-7xl">La mémoire académique qui <span className="text-[#c87536]">se transmet.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#536d62] sm:text-lg">Un espace simple pour retrouver les cours, TD, TP, examens et rapports qui accompagnent chaque génération d'étudiants.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={isAuthenticated ? "/bibliotheque" : "#connexion"}>
                <Button onClick={!isAuthenticated ? startLogin : undefined} className="h-12 rounded-full bg-[#0f4c45] px-6 text-white shadow-lg shadow-[#0f4c45]/15 hover:bg-[#0a3b36]">Explorer la bibliothèque <ArrowRight size={17} /></Button>
              </Link>
              <Link href={isAuthenticated ? "/contribuer" : "#connexion"}>
                <Button onClick={!isAuthenticated ? startLogin : undefined} variant="outline" className="h-12 rounded-full border-[#b9d0bf] bg-white/70 px-6 text-[#0f4c45] hover:bg-white">Déposer une ressource <UploadCloud size={17} /></Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs font-semibold text-[#6c8579]"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#0f4c45]" />Validation humaine</span><span className="flex items-center gap-2"><HeartHandshake size={15} className="text-[#c87536]" />Transmission responsable</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-[#0f4c45]/10 backdrop-blur">
              <div className="rounded-[1.5rem] bg-[#0f4c45] p-6 text-[#edf6df]">
                <div className="flex items-start justify-between"><div><div className="text-xs uppercase tracking-[0.2em] text-[#b8d3b4]">Collection active</div><div className="mt-2 font-display text-3xl font-bold">ESTBA</div></div><LibraryBig size={30} className="text-[#e2a160]" /></div>
                <div className="mt-10 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><div className="text-3xl font-bold">{catalog.data?.programs.length ?? 4}</div><div className="mt-1 text-xs text-[#b8d3b4]">filières</div></div><div className="rounded-2xl bg-white/10 p-4"><div className="text-3xl font-bold">{catalog.data?.courses.length ?? 0}</div><div className="mt-1 text-xs text-[#b8d3b4]">UE référencées</div></div></div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#d88a3c] px-3 py-2 text-xs font-bold text-white"><FileCheck2 size={15} />Les documents sont vérifiés avant publication</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c87536]">Le référentiel</div><h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0f4c45]">Un chemin clair vers la bonne ressource</h2></div><Link href="/bibliotheque" className="flex items-center gap-1 text-sm font-bold text-[#0f4c45]">Voir la bibliothèque <ArrowRight size={15} /></Link></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tracks.map(track => <Link key={track.code} href={isAuthenticated ? `/bibliotheque?program=${track.code}` : "#connexion"} onClick={!isAuthenticated ? startLogin : undefined} className="group rounded-2xl border border-[#dce8df] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#abcbb3] hover:shadow-lg hover:shadow-[#18332e]/5"><div className={`mb-8 inline-flex rounded-xl px-3 py-2 font-display text-lg font-bold ${track.color}`}>{track.code}</div><div className="text-sm font-bold leading-5 text-[#18332e]">{track.name}</div><div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#7b9288] group-hover:text-[#0f4c45]">Explorer <ArrowRight size={13} /></div></Link>)}</div>
      </section>

      <section className="border-y border-[#dce8df] bg-white/60"><div className="container grid gap-10 py-14 md:grid-cols-3"><div><BookMarked className="text-[#c87536]" size={24} /><h3 className="mt-4 font-display text-xl font-bold text-[#0f4c45]">Conserver le contexte</h3><p className="mt-2 text-sm leading-6 text-[#6c8177]">Chaque document reste rattaché à sa filière, son niveau, son année et son UE.</p></div><div><Search className="text-[#0f4c45]" size={24} /><h3 className="mt-4 font-display text-xl font-bold text-[#0f4c45]">Retrouver rapidement</h3><p className="mt-2 text-sm leading-6 text-[#6c8177]">Une recherche simple et des filtres pensés pour le quotidien étudiant.</p></div><div><HeartHandshake className="text-[#789b70]" size={24} /><h3 className="mt-4 font-display text-xl font-bold text-[#0f4c45]">Transmettre avec soin</h3><p className="mt-2 text-sm leading-6 text-[#6c8177]">Les contributions sont examinées avant publication, notamment pour protéger les données personnelles.</p></div></div></section>
    </AppShell>
  );
}
