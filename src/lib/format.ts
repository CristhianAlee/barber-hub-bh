import { format as formatDateFns } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import type { TranslationKey } from "@/i18n/pt";
import type { Language } from "@/hooks/useLanguage";

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

export const formatPhone = (raw: string) => {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

export const formatDateBR = (d: string | Date, lang: Language = "pt") => {
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  return lang === "en"
    ? new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long", year: "numeric" }).format(date)
    : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

// Data curta numérica (dd/MM em PT, MM/dd em EN) — substitui hacks tipo
// formatDateBR(x).split(" de ")... que só funcionavam em português.
export const formatDateShortNumeric = (d: string | Date, lang: Language): string => {
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  return lang === "en" ? formatDateFns(date, "MM/dd") : formatDateFns(date, "dd/MM");
};

// Fonte única de "data como YYYY-MM-DD" pro projeto inteiro (frontend).
// Usa UTC (toISOString) deliberadamente — é o padrão já usado em todo
// o resto do código (agendamentos, financeiro, checkout, agendamento
// público). Não trocar por getFullYear/getMonth/getDate: isso causou
// o Dashboard divergir do resto do app perto da virada do dia (Brasil
// é UTC-3, então getters locais e toISOString discordam por até 3h).
export const formatDateISO = (d: Date): string => d.toISOString().slice(0, 10);

// Datas localizadas (PT/EN) usando date-fns — substitui os vários
// new Intl.DateTimeFormat("pt-BR", ...) hardcoded espalhados pelo
// projeto, que não reagiam ao toggle de idioma.
const dfnsLocale = (lang: Language) => (lang === "en" ? enUS : ptBR);

export const formatWeekdayShort = (d: Date, lang: Language): string =>
  formatDateFns(d, "EEE", { locale: dfnsLocale(lang) });

export const formatDayHeader = (d: Date, lang: Language): string =>
  lang === "en"
    ? formatDateFns(d, "EEEE, MMMM d", { locale: dfnsLocale(lang) })
    : formatDateFns(d, "EEEE, d 'de' MMMM", { locale: dfnsLocale(lang) });

export const formatShortDateLabel = (d: Date, lang: Language): string =>
  lang === "en"
    ? formatDateFns(d, "EEE, MMM d", { locale: dfnsLocale(lang) })
    : formatDateFns(d, "EEE, d 'de' MMM", { locale: dfnsLocale(lang) });

export const formatMonthYear = (d: Date, lang: Language): string =>
  lang === "en"
    ? formatDateFns(d, "MMMM yyyy", { locale: dfnsLocale(lang) })
    : formatDateFns(d, "MMMM 'de' yyyy", { locale: dfnsLocale(lang) });

export function copyToClipboard(text: string): void {
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;top:0;left:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); } catch { /* ignore */ }
    document.body.removeChild(ta);
  };
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(fallback);
  } else {
    fallback();
  }
}

export const passwordStrength = (pw: string): { score: number; labelKey: TranslationKey } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labelKeys: TranslationKey[] = [
    "password_strength_1", "password_strength_2", "password_strength_3",
    "password_strength_4", "password_strength_5", "password_strength_6",
  ];
  return { score, labelKey: labelKeys[score] };
};
