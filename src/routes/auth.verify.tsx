import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { localData } from "@/lib/local-data";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/verify")({
  component: Verify,
  validateSearch: (s: Record<string, unknown>) => ({ email: (s.email as string) ?? "" }),
});

function Verify() {
  const { email } = Route.useSearch();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const resend = async () => {
    if (!email) return toast.error("E-mail não informado");
    setResending(true);
    const { error } = await localData.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("E-mail reenviado!");
    setCooldown(30);
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <Card className="border-border bg-card p-6 text-center">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Mail className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl tracking-wide">Verifique seu e-mail</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enviamos um link de confirmação para
        {email ? <> <span className="text-foreground">{email}</span></> : " seu e-mail"}.
        Clique no link para ativar sua conta.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2 rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" /> Após confirmar, faça login para acessar o painel.
      </div>
      <Button
        variant="outline"
        onClick={resend}
        disabled={resending || cooldown > 0 || !email}
        className="mt-5 w-full"
      >
        {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail"}
      </Button>
      <Button asChild className="mt-2 w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Link to="/auth/login">Ir para login</Link>
      </Button>
    </Card>
  );
}
