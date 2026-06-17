import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Calendar,
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  Smartphone,
  Sparkles,
  Check,
  ChevronDown,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function LangToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        onClick={() => setLanguage("pt")}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
          language === "pt" ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        PT
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
          language === "en" ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}

function Feature({ icon: Icon, title, desc, num }: { icon: any; title: string; desc: string; num: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        padding: 1,
        borderRadius: 20,
        transition: "background 0.35s ease",
        background: hovered
          ? "linear-gradient(135deg, oklch(0.78 0.14 75 / 0.65), oklch(0.78 0.14 75 / 0.12) 50%, oklch(0.78 0.14 75 / 0.45))"
          : "linear-gradient(135deg, oklch(0.78 0.14 75 / 0.16), transparent 50%, oklch(0.78 0.14 75 / 0.07))",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: 19,
          padding: "32px 28px 36px",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.35s cubic-bezier(.22,.61,.36,1), box-shadow 0.35s ease",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 24px 56px -16px oklch(0.78 0.14 75 / 0.18), 0 8px 24px -8px oklch(0 0 0 / 0.28)"
            : "0 2px 12px -4px oklch(0 0 0 / 0.18)",
        }}
      >
        {/* Faint background number */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -10,
            right: 16,
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: "var(--font-display)",
            color: "var(--color-gold)",
            opacity: hovered ? 0.09 : 0.05,
            transition: "opacity 0.35s ease",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "-0.02em",
          }}
        >
          {String(num).padStart(2, "0")}
        </div>

        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: hovered ? "oklch(0.78 0.14 75 / 0.18)" : "oklch(0.78 0.14 75 / 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            transition: "background 0.35s ease, box-shadow 0.35s ease",
            boxShadow: hovered ? "0 0 28px oklch(0.78 0.14 75 / 0.32)" : "none",
          }}
        >
          <Icon style={{ width: 26, height: 26, color: "var(--color-gold)" }} />
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 10, lineHeight: 1.25 }}>
          {title}
        </div>
        <p style={{ fontSize: 14, color: "var(--color-muted-foreground)", lineHeight: 1.7 }}>
          {desc}
        </p>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "15%",
            right: "15%",
            height: 2,
            borderRadius: "2px 2px 0 0",
            background: hovered
              ? "linear-gradient(90deg, transparent, oklch(0.78 0.14 75 / 0.85), transparent)"
              : "transparent",
            transition: "background 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-muted/20"
      >
        <span className="font-semibold text-foreground">{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}

const PRICING_PRICE = "R$ 69,99";

function Landing() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Calendar,
      title: "Agendamento Online",
      desc: "Seus clientes agendam sozinhos pelo celular, 24 horas por dia. Sem ligações, sem confusão, sem horário perdido.",
    },
    {
      icon: LayoutDashboard,
      title: "Painel do Barbeiro",
      desc: "Veja todos os agendamentos do dia, confirme com um clique e gerencie sua agenda em tempo real.",
    },
    {
      icon: TrendingUp,
      title: "Financeiro Real",
      desc: "Receitas, despesas e lucro calculados automaticamente. Saiba exatamente quanto entra e sai todo dia.",
    },
    {
      icon: Package,
      title: "Estoque Inteligente",
      desc: "Alerta automático quando o produto está acabando. Nunca mais fique sem pomada no momento errado.",
    },
    {
      icon: Users,
      title: "Clientes Ativos",
      desc: "Histórico completo de cada cliente. Lembre quem não aparece há 30 dias e traga de volta com um clique.",
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      desc: "Feito para usar no celular durante o atendimento. Rápido, intuitivo e sem fricção nenhuma.",
    },
  ];

  const benefits = [
    t("landing_pricing_b1"),
    t("landing_pricing_b2"),
    t("landing_pricing_b3"),
    t("landing_pricing_b4"),
    t("landing_pricing_b5"),
    t("landing_pricing_b6"),
    t("landing_pricing_b7"),
  ];

  const faqs = [
    { q: t("landing_faq_q1"), a: t("landing_faq_a1") },
    { q: t("landing_faq_q2"), a: t("landing_faq_a2") },
    { q: t("landing_faq_q3"), a: t("landing_faq_a3") },
    { q: t("landing_faq_q4"), a: t("landing_faq_a4") },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-2xl tracking-wider">
              BARBER<span className="text-gold">HUB</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle size="sm" />
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">{t("landing_header_signin")}</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                {t("landing_header_start")}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-widest text-gold">
            <Sparkles className="h-3 w-3" /> {t("landing_badge")}
          </div>
          <h1 className="font-display text-5xl leading-none tracking-wide md:text-7xl lg:text-8xl">
            {t("landing_hero").split("\n").map((_line, i) => (
              <span key={i}>
                {i === 0 ? (
                  <>Tudo que sua <span className="text-gold">barbearia</span><br /></>
                ) : (
                  <>precisa em <span className="text-gold">um só lugar</span></>
                )}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("landing_hero_sub")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/planos">
              <Button size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold">
                {t("landing_cta_primary")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline" className="border-border">
                {t("landing_cta_secondary")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      </section>

      {/* ── Features */}
      <section className="border-t border-border bg-muted/10 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3 w-3" /> Funcionalidades
            </div>
            <h2 className="font-display text-4xl tracking-wide md:text-5xl lg:text-6xl">
              Tudo que sua barbearia{" "}
              <span className="text-gold">precisa</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl" style={{ fontSize: 16, color: "var(--color-muted-foreground)", lineHeight: 1.7 }}>
              Cada detalhe pensado para o dia a dia do barbeiro profissional.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Feature key={f.title} icon={f.icon} title={f.title} desc={f.desc} num={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center font-display text-3xl tracking-wide md:text-4xl">
            {t("landing_pricing_title")}
          </h2>
          <p className="mb-12 text-center text-muted-foreground">{t("landing_pricing_sub")}</p>

          <div className="mx-auto max-w-md">
            <div className="relative rounded-2xl border-2 border-gold bg-card p-8 shadow-gold">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-gradient-gold px-4 py-1 text-xs font-bold text-gold-foreground uppercase tracking-widest">
                  {t("landing_pricing_plan")}
                </span>
              </div>

              <div className="mt-2 text-center">
                <div className="flex items-end justify-center gap-1">
                  <span className="font-mono text-5xl font-bold text-white">{PRICING_PRICE}</span>
                  <span className="mb-1.5 text-muted-foreground">{t("landing_pricing_period")}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t("landing_pricing_trial")}</p>
              </div>

              <ul className="mt-8 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>

              <Link to="/planos" className="mt-8 block">
                <Button
                  size="lg"
                  className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold"
                >
                  {t("landing_pricing_cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">🔒 Pagamento seguro via Stripe</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center font-display text-3xl tracking-wide md:text-4xl">
            {t("landing_faq_title")}
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} question={f.q} answer={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-display text-xl tracking-wider">
                BARBER<span className="text-gold">HUB</span>
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a
                href="mailto:suporte@barberhub.com.br"
                className="flex items-center gap-1.5 transition hover:text-gold"
              >
                <Mail className="h-3.5 w-3.5" />
                {t("landing_footer_email")}
              </a>
              <Link to="/termos" className="transition hover:text-gold">
                {t("landing_footer_terms")}
              </Link>
              <Link to="/privacidade" className="transition hover:text-gold">
                {t("landing_footer_privacy")}
              </Link>
            </nav>

            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} BarberHub — {t("landing_footer_rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
