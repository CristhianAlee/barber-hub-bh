import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ThemeProvider } from "@/hooks/useTheme";
import { Toaster } from "@/components/ui/sonner";
import { CookieBanner } from "@/components/shared/CookieBanner";

interface RouterContext {
  queryClient: QueryClient;
}

function RootComponent() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" duration={4000} />
          <CookieBanner />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error("[RootError]", error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h2 className="text-xl font-semibold text-foreground">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">Recarregue a página para continuar.</p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground"
      >
        Recarregar
      </button>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-7xl font-bold text-foreground">404</h1>
      <h2 className="text-xl font-semibold text-foreground">Página não encontrada</h2>
      <a href="/" className="text-gold hover:underline">
        Voltar ao início
      </a>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});
