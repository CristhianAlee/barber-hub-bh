import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/hooks/useLanguage";
import { redirectToCheckout } from "@/services/stripeService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { TranslationKey } from "@/i18n/pt";

export const Route = createFileRoute("/planos")({
  component: Planos,
});

const FEATURE_KEYS: TranslationKey[] = [
  "planos_feat_1", "planos_feat_2", "planos_feat_3", "planos_feat_4",
  "planos_feat_5", "planos_feat_6", "planos_feat_7",
];

const FAQ_KEYS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: "planos_faq_q1", a: "planos_faq_a1" },
  { q: "planos_faq_q2", a: "planos_faq_a2" },
  { q: "planos_faq_q3", a: "planos_faq_a3" },
];

function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      console.error("[Planos]", err);
      setBusy(false);
      toast.error(t("err_try_again"));
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
              TRATO <span className="text-gold">BARBER</span>
            </span>
          </Link>
          {!user && (
            <Link to="/auth/login" className="text-sm text-gold hover:underline">
              {t("landing_header_signin")}
            </Link>
          )}
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl tracking-wide md:text-5xl">
            {t("planos_hero_pre")} <span className="text-gold">{t("planos_hero_gold")}</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("planos_hero_sub")}
          </p>
        </div>

        {/* Card único */}
        <Card className="mx-auto max-w-md border-gold/40 bg-gradient-to-br from-gold/10 to-card p-8 shadow-gold">
          <div className="text-center">
            <h2 className="font-display text-2xl tracking-wide text-gold">Trato Barber Pro</h2>
            <div className="mt-3 flex items-end justify-center gap-1">
              <span className="font-display text-5xl tracking-wide">R$ 69,99</span>
              <span className="mb-1 text-sm text-muted-foreground">{t("landing_pricing_period")}</span>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5">
            {FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-success" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={start}
            disabled={busy}
            size="lg"
            className="mt-7 w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("landing_pricing_cta")}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("planos_trial_note")}
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> {t("planos_secure_payment")}
          </p>
        </Card>

        {/* FAQ */}
        <div className="mx-auto mt-12 max-w-md space-y-4">
          <h3 className="text-center font-display text-xl tracking-wide">{t("planos_faq_title")}</h3>
          {FAQ_KEYS.map((item) => (
            <div key={item.q} className="rounded-lg border border-border bg-card/60 p-4">
              <div className="text-sm font-medium">{t(item.q)}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t(item.a)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
