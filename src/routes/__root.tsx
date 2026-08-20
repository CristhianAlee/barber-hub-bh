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

// errorComponent/notFoundComponent da rota raiz podem renderizar fora do
// LanguageProvider (substituem o RootComponent inteiro em caso de falha),
// então usar useLanguage() aqui arriscaria um segundo crash. Lemos o idioma
// direto do localStorage, com o mesmo fallback "pt" do provider.
const FALLBACK_STRINGS = {
  pt: {
    errorTitle: "Algo deu errado",
    errorBody: "Recarregue a página para continuar.",
    reload: "Recarregar",
    notFoundTitle: "Página não encontrada",
    backHome: "Voltar ao início",
  },
  en: {
    errorTitle: "Something went wrong",
    errorBody: "Reload the page to continue.",
    reload: "Reload",
    notFoundTitle: "Page not found",
    backHome: "Back to home",
  },
};

function getFallbackStrings() {
  if (typeof window === "undefined") return FALLBACK_STRINGS.pt;
  return window.localStorage.getItem("barberhub.language") === "en"
    ? FALLBACK_STRINGS.en
    : FALLBACK_STRINGS.pt;
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
  const s = useFallbackStrings();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h2 className="text-xl font-semibold text-foreground">{s.errorTitle}</h2>
      <p className="text-sm text-muted-foreground">{s.errorBody}</p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground"
      >
        {s.reload}
      </button>
    </div>
  );
}

function NotFoundComponent() {
  const s = useFallbackStrings();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-7xl font-bold text-foreground">404</h1>
      <h2 className="text-xl font-semibold text-foreground">{s.notFoundTitle}</h2>
      <a href="/" className="text-gold hover:underline">
        {s.backHome}
      </a>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});
