import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Barbershop = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  booking_interval_minutes: number;
  max_advance_days: number;
  onboarded: boolean;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  barbershop: Barbershop | null;
  loading: boolean;
  refreshBarbershop: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBarbershop = async (uid: string) => {
    const { data } = await supabase
      .from("barbershops")
      .select("id, name, slug, phone, address, logo_url, booking_interval_minutes, max_advance_days, onboarded")
      .eq("owner_id", uid)
      .maybeSingle();
    setBarbershop((data as Barbershop) ?? null);
  };

  useEffect(() => {
    let mounted = true;
    // Fallback: nunca deixar a tela presa em loading mais que 3s (multi-aba pode travar o lock do supabase.auth)
    const failSafe = setTimeout(() => { if (mounted) setLoading(false); }, 3000);

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadBarbershop(sess.user.id), 0);
      } else {
        setBarbershop(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadBarbershop(s.user.id).finally(() => mounted && setLoading(false));
      else setLoading(false);
    }).catch((e) => {
      console.error("[Auth] getSession falhou:", e);
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      clearTimeout(failSafe);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        barbershop,
        loading,
        refreshBarbershop: async () => {
          if (user) await loadBarbershop(user.id);
        },
        signOut: async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            setUser(null);
            setSession(null);
            setBarbershop(null);
            if (typeof window !== "undefined") {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = "/auth/login";
            }
          }
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return c;
};
