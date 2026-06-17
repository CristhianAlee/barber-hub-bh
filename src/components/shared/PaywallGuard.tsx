import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { hasActiveAccess, redirectToCheckout, redirectToPortal } from "@/services/stripeService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Loader2, Lock, AlertTriangle, CalendarX } from "lucide-react";
import { toast } from "sonner";

type Action = "checkout" | "portal";

function PaywallScreen({
  icon,
  title,
  desc,
  cta,
  action,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  cta: string;
  action: Action;
}) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      if (action === "checkout") await redirectToCheckout();
      else await redirectToPortal();
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dark px-4">
      <Card className="w-full max-w-md border-gold/30 bg-card/80 p-8 text-center backdrop-blur">
        <div className="mb-6 flex justify-center">
          <Logo size={48} />
        </div>
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold">
          {icon}
        </div>
        <h1 className="font-display text-2xl tracking-wide">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <Button
          onClick={onClick}
          disabled={busy}
          size="lg"
          className="mt-6 w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : cta}
        </Button>
        <p className="mt-3 text-[11px] text-muted-foreground">🔒 Pagamento seguro via Stripe</p>
      </Card>
    </div>
  );
}

export function PaywallGuard({ children }: { children: ReactNode }) {
  const { barbershop, loading } = useAuth();

  // Durante o carregamento ou sem barbearia, o app.tsx já trata
  // (spinner / redirect p/ onboarding). Não bloqueia aqui.
  if (loading || !barbershop) return <>{children}</>;
  if (hasActiveAccess(barbershop)) return <>{children}</>;

  switch (barbershop.subscription_status) {
    case "past_due":
      return (
        <PaywallScreen
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Pagamento pendente"
          desc="Não conseguimos processar sua última cobrança. Atualize sua forma de pagamento para continuar usando o BarberHub Pro."
          cta="Atualizar forma de pagamento"
          action="portal"
        />
      );
    case "canceled":
      return (
        <PaywallScreen
          icon={<CalendarX className="h-8 w-8" />}
          title="Assinatura cancelada"
          desc="Sua assinatura foi cancelada. Reative quando quiser para voltar a ter acesso completo."
          cta="Reativar assinatura"
          action="checkout"
        />
      );
    default:
      // trial expirado, incomplete ou qualquer estado sem acesso.
      return (
        <PaywallScreen
          icon={<Lock className="h-8 w-8" />}
          title="Seu teste grátis terminou"
          desc="Assine o BarberHub Pro por R$ 69,99/mês e continue com agendamento, financeiro, estoque e tudo mais."
          cta="Assinar agora"
          action="checkout"
        />
      );
  }
}
