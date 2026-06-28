import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
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

async function fetchBarbershop(userId: string): Promise<Barbershop | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const { data, error } = await supabase
      .from("barbershops")
      .select(
        "id, name, slug, phone, address, logo_url, booking_interval_minutes, max_advance_days, onboarded, subscription_status, trial_ends_at, current_period_ends_at, stripe_customer_id, stripe_subscription_id",
      )
      .eq("owner_id", userId)
      .maybeSingle();

    clearTimeout(timeout);
    if (error || !data) return null;
    return data as Barbershop;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBarbershop = async () => {
    if (!user) return;
    const bs = await fetchBarbershop(user.id);
    setBarbershop(bs);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const bs = await fetchBarbershop(s.user.id);
        if (mounted) setBarbershop(bs);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // IMPORTANTE: o callback do onAuthStateChange roda sob um lock interno
        // de auth do supabase-js. Fazer await de uma query aqui dentro
        // (fetchBarbershop precisa do token) deadlocka até o lock expirar —
        // é a causa do "loading longo" após o OAuth do Google, que o F5 resolve.
        // Deferimos com setTimeout(0) para sair do lock antes de consultar.
        const uid = s.user.id;
        setTimeout(async () => {
          if (!mounted) return;
          const bs = await fetchBarbershop(uid);
          if (mounted) {
            setBarbershop(bs);
            setLoading(false);
          }
        }, 0);
      } else {
        setBarbershop(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        barbershop,
        loading,
        refreshBarbershop,
        signOut: async () => {
          await supabase.auth.signOut();
          localStorage.clear();
          window.location.href = "/auth/login";
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
