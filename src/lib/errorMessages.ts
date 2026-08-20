import type { TranslationKey } from "@/i18n/pt";

interface SupabaseError {
  code?: string;
  message?: string;
}

const KNOWN_ERROR_KEYS: Record<string, TranslationKey> = {
  "23505": "err_slot_taken",
  "42501": "err_no_permission",
  "23503": "err_related_not_found",
  "23502": "appt_fill_all_fields",
  "22P02": "err_invalid_data",
  PGRST116: "err_record_not_found",
  PGRST301: "err_session_expired",
};

/**
 * Traduz erros técnicos (Postgres/Supabase/rede) em mensagens amigáveis,
 * localizadas via t(). NUNCA retorna a mensagem técnica bruta — o erro
 * completo deve ser logado com console.error antes de chamar esta função.
 *
 * `t` é passado pelo chamador (função utilitária pura, sem acesso ao
 * hook useLanguage). `actionKey` é uma TranslationKey de ação no
 * infinitivo (ex: "err_action_save_product") usada no fallback genérico
 * "Não foi possível {ação}." / "Couldn't {action}.".
 */
export function getFriendlyErrorMessage(
  err: unknown,
  t: (key: TranslationKey) => string,
  actionKey?: TranslationKey,
): string {
  const error = err as SupabaseError;
  const code = error?.code;
  const message = error?.message ?? "";

  if (code && KNOWN_ERROR_KEYS[code]) {
    return t(KNOWN_ERROR_KEYS[code]);
  }

  if (message.includes("appointments_no_double_booking")) {
    return t("err_slot_taken");
  }
  if (message.includes("Email not confirmed")) {
    return t("err_email_not_confirmed");
  }
  if (message.includes("JWT") || message.includes("token")) {
    return t("err_session_expired");
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return t("err_network");
  }

  return actionKey
    ? t("err_could_not_template").replace("{action}", t(actionKey))
    : t("err_generic_fallback");
}
