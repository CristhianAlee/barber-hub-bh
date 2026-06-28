import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PaywallGuard } from "@/components/shared/PaywallGuard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/hooks/useLanguage";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Loader2, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } as any });
    }
  },
  component: AppLayout,
});

function LangToggle() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        onClick={() => setLanguage("pt")}
        className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
          language === "pt" ? "bg-gold text-gold-foreground" : "text-muted-foreground"
        }`}
      >
        PT
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
          language === "en" ? "bg-gold text-gold-foreground" : "text-muted-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition hover:text-gold"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function AppLayout() {
  const { loading, barbershop, user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    if (loading || path.includes("/onboarding")) return;
    if (!barbershop || !barbershop.onboarded) {
      navigate({ to: "/app/onboarding" });
    }
  }, [loading, barbershop, path, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  // Sem barbearia / onboarding incompleto: NÃO renderiza o painel (evita telas
  // quebradas com dados nulos). O useEffect acima já redireciona para o
  // onboarding; aqui mostramos o loader enquanto o redirect acontece. Na
  // própria rota de onboarding, renderiza normalmente (o Outlet = formulário).
  if ((!barbershop || !barbershop.onboarded) && !path.includes("/onboarding")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-border md:block">
        <AppSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-xl tracking-wider">
              BARBER<span className="text-gold">HUB</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LangToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-r-border bg-sidebar p-0">
                <AppSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <PaywallGuard>
            <Outlet />
          </PaywallGuard>
        </main>
      </div>
    </div>
  );
}
