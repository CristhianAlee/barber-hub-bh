import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type User = {
  id: string;
  email?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
};

type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
};

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
export const LOCAL_AUTH_STORAGE_KEY = "barberhub.localAuth";

function createLocalUser(email: string): User {
  return {
    id: "local-dev-user",
    email,
    app_metadata: {},
    user_metadata: { name: "Usuario Local" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

function createLocalSession(user: User): Session {
  return {
    access_token: "local-dev-token",
    refresh_token: "local-dev-refresh-token",
    expires_in: 60 * 60 * 24 * 365,
    token_type: "bearer",
    user,
  } as Session;
}

function createLocalBarbershop(): Barbershop {
  return {
    id: "local-dev-barbershop",
    name: "Barbearia Local",
    slug: "barbearia-local",
    phone: null,
    address: null,
    logo_url: null,
    booking_interval_minutes: 30,
    max_advance_days: 30,
    onboarded: true,
  };
}

export function getLocalAuthEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown };
    return typeof parsed.email === "string" ? parsed.email : null;
  } catch {
    return null;
  }
}

export function signInLocal(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_AUTH_STORAGE_KEY,
    JSON.stringify({ email, signedInAt: new Date().toISOString() }),
  );
}

export function signOutLocal() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLocalSession = () => {
    const email = getLocalAuthEmail();
    if (!email) {
      setUser(null);
      setSession(null);
      setBarbershop(null);
      return;
    }

    const localUser = createLocalUser(email);
    setUser(localUser);
    setSession(createLocalSession(localUser));
    setBarbershop(createLocalBarbershop());
  };

  useEffect(() => {
    let mounted = true;
    loadLocalSession();
    setLoading(false);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCAL_AUTH_STORAGE_KEY || !mounted) return;
      loadLocalSession();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
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
          loadLocalSession();
        },
        signOut: async () => {
          signOutLocal();
          setUser(null);
          setSession(null);
          setBarbershop(null);
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
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
