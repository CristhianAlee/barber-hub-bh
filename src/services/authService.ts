import { supabase } from "@/lib/supabase";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Erro inesperado. Tente novamente.";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const authService = {
  async signIn(email: string, password: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data: null, error: null };
    } catch (err) {
      console.error("[authService.signIn]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async signInWithGoogle(): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (error) throw error;
      return { data: null, error: null };
    } catch (err) {
      console.error("[authService.signInWithGoogle]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async signUp(
    email: string,
    password: string,
    barbershopName: string,
  ): Promise<ServiceResult<null>> {
    try {
      const { data: auth, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) throw authErr;
      if (!auth.user) throw new Error("Usuário não criado");

      const slug = slugify(barbershopName) || "minha-barbearia";
      const { error: bsErr } = await supabase.from("barbershops").insert({
        owner_id: auth.user.id,
        name: barbershopName,
        slug,
        onboarded: false,
        booking_interval_minutes: 30,
        max_advance_days: 30,
      });
      if (bsErr) console.error("[authService.signUp] barbershop insert:", bsErr);

      return { data: null, error: null };
    } catch (err) {
      console.error("[authService.signUp]", err);
      return { data: null, error: errMsg(err) };
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[authService.signOut]", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.clear();
        window.location.href = "/auth/login";
      }
    }
  },

  async resetPassword(email: string): Promise<ServiceResult<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      return { data: null, error: null };
    } catch (err) {
      console.error("[authService.resetPassword]", err);
      return { data: null, error: errMsg(err) };
    }
  },
};
