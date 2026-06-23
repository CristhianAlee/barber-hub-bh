import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authService } from "@/services/authService";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatPhone, onlyDigits, passwordStrength } from "@/lib/format";
import { signupSchema } from "@/lib/validationSchemas";
import { useFormValidation } from "@/hooks/useFormValidation";

export const Route = createFileRoute("/auth/signup")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    barbershop: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    terms: false,
    marketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const { errors, validate, clearError } = useFormValidation(signupSchema);

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    const { error } = await authService.signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error("Erro ao conectar com Google. Tente novamente.");
    }
  };

  const ps = passwordStrength(form.password);
  const phoneDigits = onlyDigits(form.phone);

  // "Confirmar senha" não faz parte do signupSchema — validado à parte.
  const confirmError =
    form.confirm.length === 0
      ? triedSubmit
        ? "Confirme sua senha"
        : ""
      : form.confirm !== form.password
      ? "As senhas não coincidem"
      : "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    const schemaOk = validate({
      name: form.name,
      email: form.email,
      password: form.password,
      barbershop_name: form.barbershop,
      phone: phoneDigits,
    });
    const confirmOk = form.confirm.length > 0 && form.confirm === form.password;
    if (!schemaOk || !confirmOk || !form.terms) return;
    setLoading(true);
    const { error } = await authService.signUp(form.email, form.password, {
      fullName: form.name,
      barbershopName: form.barbershop,
      phone: phoneDigits,
    });
    if (error) {
      setLoading(false);
      toast.error(error.includes("already") ? "Este e-mail já está cadastrado" : "Erro ao criar conta");
      return;
    }
    // Save LGPD consent record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_consents").insert({
        user_id: user.id,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "2025-06",
        marketing_consent: form.marketing,
        cookie_consent: localStorage.getItem("barberhub-cookie-consent") ?? "essential-only",
      }).select().maybeSingle();
    }
    setLoading(false);
    toast.success("Conta criada! Verifique seu e-mail");
    navigate({ to: "/auth/verify", search: { email: form.email } });
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">{t("auth_signup_title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth_signup_sub")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input id="name" maxLength={100} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); clearError("name"); }} required />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bs">{t("auth_bname")}</Label>
          <Input id="bs" maxLength={100} value={form.barbershop} onChange={(e) => { setForm({ ...form, barbershop: e.target.value }); clearError("barbershop_name"); }} required />
          {errors.barbershop_name && <p className="text-xs text-destructive">{errors.barbershop_name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            inputMode="tel"
            maxLength={20}
            value={form.phone}
            onChange={(e) => { setForm({ ...form, phone: formatPhone(e.target.value) }); clearError("phone"); }}
            placeholder="(00) 00000-0000"
            required
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth_email")}</Label>
          <Input id="email" type="email" maxLength={254} value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError("email"); }} required />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">{t("auth_password")}</Label>
          <Input
            id="pw"
            type="password"
            maxLength={128}
            value={form.password}
            onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError("password"); }}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
          {form.password && (
            <div className="flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${
                      i < ps.score
                        ? ps.score <= 2
                          ? "bg-destructive"
                          : ps.score === 3
                          ? "bg-warning"
                          : "bg-success"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{ps.label}</span>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            maxLength={128}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          {confirmError && (
            <p className="text-xs text-destructive">{confirmError}</p>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={form.terms}
            onCheckedChange={(v) => setForm({ ...form, terms: !!v })}
            className="mt-0.5 shrink-0"
          />
          <span>
            Li e concordo com os{" "}
            <Link to="/termos" target="_blank" rel="noopener" className="text-gold hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/privacidade" target="_blank" rel="noopener" className="text-gold hover:underline">
              Política de Privacidade
            </Link>{" "}
            do BarberHub. <span className="text-destructive">*</span>
          </span>
        </label>
        {triedSubmit && !form.terms && (
          <p className="text-xs text-destructive">Você precisa aceitar os termos para criar uma conta</p>
        )}
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={form.marketing}
            onCheckedChange={(v) => setForm({ ...form, marketing: !!v })}
            className="mt-0.5 shrink-0"
          />
          <span>
            Aceito receber novidades e dicas do BarberHub por e-mail.
            Você pode cancelar a qualquer momento.
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth_signup_btn")}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-2">ou cadastre-se com</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={googleLoading}
        onClick={handleGoogleAuth}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Cadastrar com Google
          </>
        )}
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth_has_account")}{" "}
        <Link to="/auth/login" className="text-gold hover:underline">
          {t("auth_login_link")}
        </Link>
      </p>
    </div>
  );
}
