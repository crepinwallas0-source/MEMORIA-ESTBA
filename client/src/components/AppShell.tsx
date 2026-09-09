import { BookOpen, FilePlus2, LayoutDashboard, LogIn, LogOut, Search, ShieldCheck, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/bibliotheque", label: "Bibliothèque", icon: Search },
  { href: "/contribuer", label: "Contribuer", icon: Upload },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f7f3] text-[#18332e]">
      <header className="sticky top-0 z-40 border-b border-[#dce8df] bg-[#f5f7f3]/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f4c45] text-[#e3f2d9] shadow-sm">
              <BookOpen size={21} strokeWidth={2.2} />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-lg font-bold tracking-tight text-[#0f4c45]">MEMORIA</div>
              <div className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b9288]">ESTBA · transmission</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-[#dcefe0] text-[#0f4c45]" : "text-[#5d746a] hover:bg-white hover:text-[#0f4c45]"}`}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link href="/admin" className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${location.startsWith("/admin") ? "bg-[#f8e6c8] text-[#8b5319]" : "text-[#5d746a] hover:bg-white hover:text-[#0f4c45]"}`}>
                <ShieldCheck size={16} />
                Administration
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold text-[#18332e]">{user?.name || "Membre"}</div>
                  <div className="text-[11px] text-[#7b9288]">{user?.role === "admin" ? "Administrateur" : "Étudiant"}</div>
                </div>
                <Button aria-label="Se déconnecter" variant="outline" size="icon" className="border-[#cfe0d5] bg-white text-[#0f4c45] hover:bg-[#edf5ee]" onClick={() => void logout()}>
                  <LogOut size={17} />
                </Button>
              </>
            ) : (
              <Button onClick={startLogin} className="rounded-full bg-[#0f4c45] px-4 text-white hover:bg-[#0a3b36]">
                <LogIn size={16} />
                <span className="hidden sm:inline">Se connecter</span>
              </Button>
            )}
          </div>
        </div>
        <div className="container flex gap-1 overflow-x-auto pb-2 md:hidden">
          {navItems.map(item => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${location.startsWith(item.href) ? "bg-[#dcefe0] text-[#0f4c45]" : "text-[#5d746a]"}`}><Icon size={14} />{item.label}</Link>;
          })}
          {user?.role === "admin" && <Link href="/admin" className="flex shrink-0 items-center gap-2 rounded-full bg-[#f8e6c8] px-3 py-1.5 text-xs font-semibold text-[#8b5319]"><LayoutDashboard size={14} />Admin</Link>}
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-[#dce8df] bg-white/55">
        <div className="container flex flex-col justify-between gap-2 py-7 text-xs text-[#7b9288] sm:flex-row">
          <span>MEMORIA · La mémoire académique qui se transmet.</span>
          <span>ESTBA · AMB · NHD · IAA · GEE</span>
        </div>
      </footer>
    </div>
  );
}
