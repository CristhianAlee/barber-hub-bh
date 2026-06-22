// supabase/functions/stripe-webhook/index.ts
// Recebe eventos do Stripe. Valida a assinatura ANTES de qualquer ação.
// Deploy com --no-verify-jwt (Stripe não envia JWT do Supabase).
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Stripe status -> subscription_status do nosso CHECK.
function mapStatus(s: string): string {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "active";
  }
}

const periodEnd = (epoch: number | null | undefined): string | null =>
  epoch ? new Date(epoch * 1000).toISOString() : null;

// Atualiza a barbearia identificada por customer_id (ou metadata.barbershop_id).
async function updateShop(
  patch: Record<string, unknown>,
  by: { customerId?: string | null; barbershopId?: string | null },
) {
  if (by.barbershopId) {
    await admin.from("barbershops").update(patch).eq("id", by.barbershopId);
    return;
  }
  if (by.customerId) {
    await admin.from("barbershops").update(patch).eq("stripe_customer_id", by.customerId);
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? "",
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("[stripe-webhook] assinatura inválida:", (err as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId = typeof session.subscription === "string" ? session.subscription : null;
        let currentPeriodEnd: string | null = null;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          currentPeriodEnd = periodEnd(sub.current_period_end);
        }
        await updateShop(
          {
            subscription_status: "active",
            stripe_subscription_id: subId,
            current_period_ends_at: currentPeriodEnd,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : undefined,
          },
          {
            barbershopId: session.metadata?.barbershop_id ?? null,
            customerId: typeof session.customer === "string" ? session.customer : null,
          },
        );
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        let currentPeriodEnd: string | null = null;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          currentPeriodEnd = periodEnd(sub.current_period_end);
        }
        await updateShop(
          { subscription_status: "active", current_period_ends_at: currentPeriodEnd },
          { customerId: typeof invoice.customer === "string" ? invoice.customer : null },
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await updateShop(
          { subscription_status: "past_due" },
          { customerId: typeof invoice.customer === "string" ? invoice.customer : null },
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateShop(
          { subscription_status: "canceled" },
          { customerId: typeof sub.customer === "string" ? sub.customer : null },
        );
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await updateShop(
          {
            subscription_status: mapStatus(sub.status),
            stripe_subscription_id: sub.id,
            current_period_ends_at: periodEnd(sub.current_period_end),
          },
          { customerId: typeof sub.customer === "string" ? sub.customer : null },
        );
        break;
      }

      default:
        // Evento não tratado — ignora silenciosamente.
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] erro ao processar", event.type, err);
    // 500 faz o Stripe re-tentar a entrega.
    return new Response("Webhook handler error", { status: 500 });
  }
});
