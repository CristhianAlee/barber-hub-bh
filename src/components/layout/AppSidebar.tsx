import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Package,
  DollarSign,
  Settings,
  LogOut,
  Scissors,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { barbershop, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const items = [
    { to: "/app", label: t("nav_dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/app/agendamentos", label: t("nav_appointments"), icon: CalendarDays },
    { to: "/app/clientes", label: t("nav_clients"), icon: Users },
    { to: "/app/estoque", label: t("nav_stock"), icon: Package },
    { to: "/app/financeiro", label: t("nav_financial"), icon: DollarSign },
    { to: "/app/configuracoes", label: t("nav_settings"), icon: Settings },
  ];

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <Logo size={36} />
        <div>
          <div className="font-display text-xl leading-none tracking-wider">
            BARBER<span className="text-gold">HUB</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            {t("nav_management")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
          <Scissors className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{barbershop?.name ?? "Sua Barbearia"}</div>
          <div className="truncate text-xs text-muted-foreground">@{barbershop?.slug ?? "—"}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-gold/10 text-gold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* Language toggle */}
        <div className="flex items-center justify-center gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-1">
          <button
            onClick={() => setLanguage("pt")}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
              language === "pt" ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            PT
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
              language === "en" ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            EN
          </button>
        </div>

        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav_logout")}
        </Button>
      </div>
    </aside>
  );
}
