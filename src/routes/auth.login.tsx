import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInLocal } from "@/lib/auth-context";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    signInLocal(email);
    setLoading(false);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/app" });
  };

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">Entrar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Acesse o painel da sua barbearia</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
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
          <Label htmlFor="password">Senha</Label>
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
            Esqueci minha senha
          </Link>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link to="/auth/signup" className="text-gold hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
