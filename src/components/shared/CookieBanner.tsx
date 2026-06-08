import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const KEY = "barberhub-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (!saved) setVisible(true);
  }, []);

  const accept = (value: "accepted" | "essential-only") => {
    localStorage.setItem(KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-gold/40 bg-card/95 backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-300"
      role="dialog"
      aria-label="Aviso de cookies"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl leading-none">🍪</span>
          <p className="text-sm text-muted-foreground">
            Usamos cookies para manter sua sessão ativa e lembrar suas preferências. Ao continuar, você concorda com nossa{" "}
            <Link to="/privacidade" className="text-gold underline-offset-2 hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => accept("essential-only")}
          >
            Só essenciais
          </Button>
          <Button
            size="sm"
            className="bg-gradient-gold text-gold-foreground hover:opacity-90"
            onClick={() => accept("accepted")}
          >
            Aceitar todos
          </Button>
          <button
            onClick={() => accept("essential-only")}
            className="ml-1 rounded p-1 text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
