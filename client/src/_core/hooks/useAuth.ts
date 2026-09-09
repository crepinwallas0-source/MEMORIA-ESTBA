import { useCallback, useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<(Profile & { email?: string | null; name?: string | null }) | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) { setUser(null); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("id,full_name,role").eq("id", authUser.id).maybeSingle();
    setUser({ id: authUser.id, full_name: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email ?? null, role: profile?.role ?? "student", email: authUser.email, name: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
    const { data } = supabase.auth.onAuthStateChange(() => { void loadProfile(); });
    return () => data.subscription.unsubscribe();
  }, [loadProfile]);

  const logout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); }, []);
  return { user, loading, error: null, isAuthenticated: Boolean(user), logout, refresh: loadProfile };
}
