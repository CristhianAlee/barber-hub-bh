import { supabase } from "@/lib/supabase";
import { getFriendlyErrorMessage } from "@/lib/errorMessages";

/** Inicia o checkout de assinatura (redireciona para o Stripe). */
export async function redirectToCheckout(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: {} });
    if (error) throw error;
    if (data?.url) window.location.href = data.url as string;
  } catch (err) {
    console.error("[stripeService.redirectToCheckout]", err);
    throw new Error(getFriendlyErrorMessage(err, "iniciar pagamento"));
  }
}

/** Abre o Billing Portal do Stripe (gerenciar/cancelar/atualizar pagamento). */
export async function redirectToPortal(): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke("create-portal", { body: {} });
    if (error) throw error;
    if (data?.url) window.location.href = data.url as string;
  } catch (err) {
    console.error("[stripeService.redirectToPortal]", err);
    throw new Error(getFriendlyErrorMessage(err, "abrir portal"));
  }
}

/** Acesso liberado: assinatura ativa OU trial ainda não expirado. */
export function hasActiveAccess(barbershop: {
  subscription_status: string;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
}): boolean {
  if (barbershop.subscription_status === "active") return true;
  if (
    barbershop.subscription_status === "trial" &&
    barbershop.trial_ends_at &&
    new Date(barbershop.trial_ends_at) > new Date()
  ) {
    return true;
  }
  return false;
}
