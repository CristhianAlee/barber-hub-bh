// supabase/functions/create-checkout/index.ts
// Cria uma Stripe Checkout Session (assinatura) para a barbearia do usuário.
// STRIPE_SECRET_KEY vive SÓ aqui (server-side). Nunca no frontend.
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado." }, 401);
    }

    // Cliente com o JWT do usuário — valida quem está chamando.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return json({ error: "Sessão inválida." }, 401);
    }

    // Cliente service-role — operações de escrita controladas no servidor.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: shop, error: shopErr } = await admin
      .from("barbershops")
      .select("id, name, stripe_customer_id, stripe_subscription_id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (shopErr || !shop) {
      return json({ error: "Barbearia não encontrada." }, 404);
    }

    // 1) Garante um customer no Stripe.
    let customerId = shop.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: shop.name ?? undefined,
        metadata: { barbershop_id: shop.id, user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("barbershops")
        .update({ stripe_customer_id: customerId })
        .eq("id", shop.id);
    }

    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "";

    // 2) Trial de 7 dias só se a barbearia nunca teve assinatura.
    const giveTrial = !shop.stripe_subscription_id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: Deno.env.get("STRIPE_PRICE_ID") ?? "", quantity: 1 }],
      subscription_data: giveTrial ? { trial_period_days: 7 } : undefined,
      success_url: `${frontendUrl}/app?checkout=success`,
      cancel_url: `${frontendUrl}/planos`,
      metadata: { barbershop_id: shop.id },
      allow_promotion_codes: true,
    });

    return json({ url: session.url }, 200);
  } catch (err) {
    console.error("[create-checkout]", err);
    return json({ error: "Não foi possível iniciar o pagamento." }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
