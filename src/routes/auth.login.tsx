import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authService.signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.includes("Invalid") ? "E-mail ou senha incorretos" : error);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/app" });
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">{t("auth_login_title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth_login_sub")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth_email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              placeholder="voce@barbearia.com"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth_password")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="flex items-center justify-end text-sm">
          <Link to="/auth/recover" className="text-gold hover:underline">
            {t("auth_forgot")}
          </Link>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth_signin_btn")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth_no_account")}{" "}
        <Link to="/auth/signup" className="text-gold hover:underline">
          {t("auth_create")}
        </Link>
      </p>
    </div>
  );
}
