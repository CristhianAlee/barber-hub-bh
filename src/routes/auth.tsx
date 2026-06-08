import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  beforeLoad: async ({ location }) => {
    if (location.pathname.includes("/auth/reset")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) throw redirect({ to: "/app" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center gap-3">
          <Logo size={56} />
          <div className="flex flex-col">
            <span className="font-display text-3xl leading-none tracking-wider">
              BARBER<span className="text-gold">HUB</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Gestão Inteligente
            </span>
          </div>
        </Link>
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur md:p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} BarberHub
        </p>
      </div>
    </div>
  );
}
