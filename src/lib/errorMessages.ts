interface SupabaseError {
  code?: string;
  message?: string;
}

/**
 * Traduz erros técnicos (Postgres/Supabase/rede) em mensagens amigáveis
 * em português. NUNCA retorna a mensagem técnica bruta — o erro completo
 * deve ser logado com console.error antes de chamar esta função.
 */
export function getFriendlyErrorMessage(err: unknown, context?: string): string {
  const error = err as SupabaseError;
  const code = error?.code;
  const message = error?.message ?? "";

  const knownErrors: Record<string, string> = {
    "23505": "Este horário já está ocupado. Escolha outro horário.",
    "42501": "Você não tem permissão para realizar esta ação.",
    "23503": "Não foi possível completar — registro relacionado não encontrado.",
    "23502": "Preencha todos os campos obrigatórios.",
    "22P02": "Dados inválidos. Verifique as informações e tente novamente.",
    PGRST116: "Registro não encontrado.",
    PGRST301: "Sessão expirada. Faça login novamente.",
  };

  if (code && knownErrors[code]) {
    return knownErrors[code];
  }

  if (message.includes("appointments_no_double_booking")) {
    return "Este horário já está ocupado. Escolha outro horário.";
  }
  if (message.includes("JWT") || message.includes("token")) {
    return "Sessão expirada. Faça login novamente.";
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  return context
    ? `Não foi possível ${context}. Tente novamente.`
    : "Não foi possível completar. Tente novamente.";
}
