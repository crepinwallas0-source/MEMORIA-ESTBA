import { ArrowLeft, BookOpen, Eye, EyeOff, KeyRound, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Auth() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("Bienvenue dans MEMORIA");
        navigate("/bibliotheque");
      } else {
        const { error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.fullName } } });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre e-mail si la confirmation est activée.");
        setMode("login");
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Impossible de continuer"); } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-[#e8f1e7] px-4 py-8"><div className="mx-auto max-w-5xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#0f4c45]"><ArrowLeft size={16} />Retour à l'accueil</Link><div className="mt-8 grid overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-[#0f4c45]/10 md:grid-cols-[.9fr_1.1fr]"><div className="hidden bg-[#0f4c45] p-10 text-[#edf6df] md:block"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e3f2d9] text-[#0f4c45]"><BookOpen size={22} /></div><div className="mt-16 text-xs font-bold uppercase tracking-[0.2em] text-[#b8d3b4]">MEMORIA · ESTBA</div><h1 className="mt-4 font-display text-4xl font-bold leading-tight">La mémoire académique se construit ensemble.</h1><p className="mt-5 text-sm leading-6 text-[#b8d3b4]">Connectez-vous pour explorer les ressources, transmettre un document et accompagner les prochaines promotions.</p></div><div className="p-7 sm:p-10"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e0f0e5] text-[#0f4c45] md:hidden"><BookOpen size={22} /></div><div className="mt-5 md:mt-0"><div className="text-xs font-bold uppercase tracking-[0.18em] text-[#c87536]">Espace membre</div><h2 className="mt-2 font-display text-3xl font-bold text-[#0f4c45]">{mode === "login" ? "Se connecter" : "Créer un compte"}</h2><p className="mt-2 text-sm text-[#6c8177]">{mode === "login" ? "Retrouvez les ressources de votre parcours." : "Rejoignez la transmission académique de l'ESTBA."}</p></div><form onSubmit={submit} className="mt-8 space-y-4">{mode === "signup" && <label className="text-sm font-semibold text-[#3f5a4e]"><span className="flex items-center gap-2"><UserRound size={15} />Nom complet</span><Input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="mt-2 h-11 border-[#dce8df]" placeholder="Votre nom et prénom" /></label>}<label className="text-sm font-semibold text-[#3f5a4e]"><span className="flex items-center gap-2"><Mail size={15} />Adresse e-mail</span><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-2 h-11 border-[#dce8df]" placeholder="vous@exemple.com" /></label><label className="text-sm font-semibold text-[#3f5a4e]"><span className="flex items-center gap-2"><KeyRound size={15} />Mot de passe</span><div className="relative mt-2"><Input required minLength={6} type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="h-11 border-[#dce8df] pr-11" placeholder="6 caractères minimum" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7b9288]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><Button disabled={busy} type="submit" className="h-12 w-full rounded-full bg-[#0f4c45] text-white hover:bg-[#0a3b36]">{busy ? "Veuillez patienter…" : mode === "login" ? "Entrer dans MEMORIA" : "Créer mon compte"}</Button></form><div className="mt-6 text-center text-sm text-[#6c8177]">{mode === "login" ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}{" "}<button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-bold text-[#0f4c45] hover:underline">{mode === "login" ? "Créer un compte" : "Se connecter"}</button></div></div></div></div></div>;
}
