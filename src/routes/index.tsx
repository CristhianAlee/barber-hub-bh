import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, DollarSign, Package, Users, Scissors, Sparkles } from "lucide-react";
import { getLocalAuthEmail } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (getLocalAuthEmail()) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function Feature({ icon: Icon, title, desc }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition hover:border-gold/50 hover:shadow-card">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-2xl tracking-wider">BARBER<span className="text-gold">HUB</span></span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth/signup">
              <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
                Começar grátis
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs uppercase tracking-widest text-gold">
            <Sparkles className="h-3 w-3" /> Gestão inteligente para barbearias
          </div>
          <h1 className="font-display text-5xl leading-none tracking-wide md:text-7xl lg:text-8xl">
            Tudo que sua <span className="text-gold">barbearia</span><br />
            precisa em <span className="text-gold">um só lugar</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Agendamento online, controle financeiro, estoque e clientes —
            simples, rápido e direto do seu celular.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth/signup">
              <Button size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-gold">
                Criar minha conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline" className="border-border">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center font-display text-3xl tracking-wide md:text-4xl">
            Feito para o <span className="text-gold">barbeiro moderno</span>
          </h2>
          <p className="mb-12 text-center text-muted-foreground">Cada detalhe pensado para o seu dia a dia.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Calendar} title="Agendamento Online" desc="Link exclusivo para o cliente agendar sozinho. Sem ligações, sem confusão." />
            <Feature icon={Scissors} title="Painel do Barbeiro" desc="Calendário visual, status em tempo real e ações rápidas para o dia." />
            <Feature icon={DollarSign} title="Financeiro Real" desc="Receitas, despesas e ticket médio acompanhados automaticamente." />
            <Feature icon={Package} title="Estoque Inteligente" desc="Baixa automática nas vendas e alerta de produto acabando." />
            <Feature icon={Users} title="Clientes Ativos" desc="Histórico completo, lembretes para clientes inativos e fidelização." />
            <Feature icon={Sparkles} title="Mobile First" desc="Use no celular durante o atendimento. Rápido e sem fricção." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-display tracking-wider">BARBERHUB</span>
          </div>
          <p>© {new Date().getFullYear()} BarberHub — Gestão Inteligente para Barbearias</p>
        </div>
      </footer>
    </div>
  );
}
