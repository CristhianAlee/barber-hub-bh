import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { redirectToCheckout } from "@/services/stripeService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/planos")({
  component: Planos,
});

const FEATURES = [
  "Agendamento online ilimitado",
  "Painel completo do barbeiro",
  "Controle financeiro automático",
  "Estoque inteligente",
  "Gestão de clientes",
  "Link exclusivo de agendamento",
  "Suporte via WhatsApp",
];

const FAQ = [
  { q: "Preciso de cartão no trial?", a: "Não. Os 7 dias são totalmente grátis e sem cartão." },
  { q: "Posso cancelar?", a: "Sim, quando quiser — direto pelo portal de assinatura." },
  { q: "Como funciona o trial?", a: "7 dias grátis. A cobrança só acontece após o período, se você continuar." },
];

function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!user) {
      navigate({ to: "/auth/signup" });
      return;
    }
    setBusy(true);
    try {
      await redirectToCheckout();
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-xl tracking-wider">
              BARBER<span className="text-gold">HUB</span>
            </span>
          </Link>
          {!user && (
            <Link to="/auth/login" className="text-sm text-gold hover:underline">
              Entrar
            </Link>
          )}
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">
            Comece hoje. <span className="text-gold">Cancele quando quiser.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tudo o que sua barbearia precisa, num só lugar.
          </p>
        </div>

        {/* Card único */}
        <Card className="mx-auto max-w-md border-gold/40 bg-gradient-to-br from-gold/10 to-card p-8 shadow-gold">
          <div className="text-center">
            <h2 className="font-display text-2xl tracking-wide text-gold">BarberHub Pro</h2>
            <div className="mt-3 flex items-end justify-center gap-1">
              <span className="font-display text-5xl tracking-wide">R$ 69,99</span>
              <span className="mb-1 text-sm text-muted-foreground">/mês</span>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={start}
            disabled={busy}
            size="lg"
            className="mt-7 w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Começar 7 dias grátis"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Sem cartão no trial · Cancele quando quiser
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Pagamento seguro via Stripe
          </p>
        </Card>

        {/* FAQ */}
        <div className="mx-auto mt-12 max-w-md space-y-4">
          <h3 className="text-center font-display text-xl tracking-wide">Perguntas frequentes</h3>
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-lg border border-border bg-card/60 p-4">
              <div className="text-sm font-medium">{item.q}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
