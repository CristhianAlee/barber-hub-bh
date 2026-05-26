import { createContext, useContext, useState, useEffect, type ReactNode, createElement } from "react";
import { pt } from "../i18n/pt";
import { en } from "../i18n/en";
import type { TranslationKey } from "../i18n/pt";

export type Language = "pt" | "en";

const STORAGE_KEY = "barberhub.language";

const translations: Record<Language, typeof pt> = { pt, en };

type LangCtx = {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
};

const Ctx = createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "pt";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "pt";
  });

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? String(key);
  };

  return createElement(Ctx.Provider, { value: { language, setLanguage, t } }, children);
}

export function useLanguage(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLanguage deve ser usado dentro de LanguageProvider");
  return c;
}
