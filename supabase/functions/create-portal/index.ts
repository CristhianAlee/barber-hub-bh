// supabase/functions/create-portal/index.ts
// Cria uma Stripe Billing Portal Session para a barbearia do usuário.
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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return json({ error: "Sessão inválida." }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: shop, error: shopErr } = await admin
      .from("barbershops")
      .select("stripe_customer_id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (shopErr || !shop?.stripe_customer_id) {
      return json({ error: "Nenhuma assinatura encontrada." }, 404);
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: shop.stripe_customer_id,
      return_url: `${Deno.env.get("FRONTEND_URL") ?? ""}/app/configuracoes`,
    });

    return json({ url: portal.url }, 200);
  } catch (err) {
    console.error("[create-portal]", err);
    return json({ error: "Não foi possível abrir o portal." }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
