const LOCAL_AUTH_STORAGE_KEY = "barberhub.localAuth";

type QueryResult<T = unknown> = {
  data: T;
  error: null;
};

function ok<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

function getLocalSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown };
    const email = typeof parsed.email === "string" ? parsed.email : "local@barberhub.dev";

    return {
      access_token: "local-dev-token",
      refresh_token: "local-dev-refresh-token",
      expires_in: 60 * 60 * 24 * 365,
      token_type: "bearer",
      user: {
        id: "local-dev-user",
        email,
        app_metadata: {},
        user_metadata: { name: "Usuario Local" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
    };
  } catch {
    return null;
  }
}

function saveLocalSession(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_AUTH_STORAGE_KEY,
    JSON.stringify({ email, signedInAt: new Date().toISOString() }),
  );
}

function clearLocalSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
}

function createQuery(data: unknown = []): any {
  const query: any = {
    select: (..._args: any[]) => query,
    insert: (..._args: any[]) => query,
    update: (..._args: any[]) => query,
    delete: (..._args: any[]) => query,
    upsert: (..._args: any[]) => query,
    eq: (..._args: any[]) => query,
    neq: (..._args: any[]) => query,
    gt: (..._args: any[]) => query,
    gte: (..._args: any[]) => query,
    lt: (..._args: any[]) => query,
    lte: (..._args: any[]) => query,
    like: (..._args: any[]) => query,
    ilike: (..._args: any[]) => query,
    in: (..._args: any[]) => query,
    is: (..._args: any[]) => query,
    order: (..._args: any[]) => query,
    limit: (..._args: any[]) => query,
    range: (..._args: any[]) => query,
    single: async () => ok(null),
    maybeSingle: async () => ok(null),
    then: (resolve: any, reject: any) => Promise.resolve(ok(data)).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(ok(data)).catch(reject),
    finally: (handler: any) => Promise.resolve(ok(data)).finally(handler),
  };

  return query;
}

export const localData: any = {
  auth: {
    getSession: async () => ok({ session: getLocalSession() }),
    signInWithPassword: async ({ email }: { email: string }) => {
      saveLocalSession(email);
      const session = getLocalSession();
      return ok({ session, user: session?.user ?? null });
    },
    signUp: async ({ email }: { email: string }) => {
      saveLocalSession(email);
      const session = getLocalSession();
      return ok({ session, user: session?.user ?? null });
    },
    signOut: async () => {
      clearLocalSession();
      return ok(null);
    },
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
    resetPasswordForEmail: async (..._args: any[]) => ok({}),
    updateUser: async (..._args: any[]) => ok({ user: getLocalSession()?.user ?? null }),
    resend: async (..._args: any[]) => ok({}),
  },
  from: (..._args: any[]) => createQuery(),
  rpc: (..._args: any[]) => createQuery(),
  storage: {
    from: (..._args: any[]) => ({
      upload: async (..._args: any[]) => ok({ path: "" }),
      remove: async (..._args: any[]) => ok([]),
      getPublicUrl: (..._args: any[]) => ({ data: { publicUrl: "" } }),
    }),
  },
};
