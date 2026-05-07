import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth/recover")({
  component: Recover,
});

function Recover() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl tracking-wide">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.
        </p>
        <Link to="/auth/login" className="mt-6 inline-block text-sm text-gold hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">Recuperar senha</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Lembrou?{" "}
        <Link to="/auth/login" className="text-gold hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
