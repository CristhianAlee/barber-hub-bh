// supabase/functions/public-booking/index.ts
// Agendamento público (link /agendar/[slug]) via service_role — substitui o
// INSERT anon direto em clients/appointments. Deploy com --no-verify-jwt
// (o agendamento é anônimo). NUNCA expõe service_role no frontend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// Global do runtime Supabase Edge para tarefas em background após a resposta.
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void } | undefined;

// Remove tags HTML e limita tamanho (defesa contra XSS persistido).
function sanitizeText(input: unknown, max: number): string {
  return String(input ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}
const isValidEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status: number): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ success: false, error: "Método não permitido." }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: "Requisição inválida." }, 400);
  }

  const {
    barbershop_id,
    professional_id,
    service_id,
    date,
    time,
    duration_minutes,
    client_name,
    client_phone,
    client_email,
    notes,
  } = payload as Record<string, any>;

  // 1) Campos obrigatórios
  if (
    !barbershop_id || !professional_id || !service_id ||
    !date || !time || !duration_minutes || !client_name || !client_phone
  ) {
    return json({ success: false, error: "Preencha todos os campos obrigatórios." }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // 2) Barbearia existe (função SQL SECURITY DEFINER já existente)
    const { data: exists, error: existsErr } = await admin.rpc("barbershop_exists", { p_id: barbershop_id });
    if (existsErr || !exists) {
      return json({ success: false, error: "Barbearia não encontrada." }, 404);
    }

    // 3) Data não pode ser no passado (compara yyyy-mm-dd)
    const today = new Date().toISOString().slice(0, 10);
    if (String(date) < today) {
      return json({ success: false, error: "Não é possível agendar em datas passadas." }, 400);
    }

    // 4) Sanitização / validação de inputs
    const name = sanitizeText(client_name, 100);
    if (name.length < 2) {
      return json({ success: false, error: "Nome inválido." }, 400);
    }
    const phone = String(client_phone).replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 15) {
      return json({ success: false, error: "Telefone inválido (10 a 15 dígitos)." }, 400);
    }
    let email: string | null = null;
    if (client_email) {
      const e = String(client_email).trim();
      if (!isValidEmail(e)) {
        return json({ success: false, error: "E-mail inválido." }, 400);
      }
      email = e;
    }
    const dur = Number(duration_minutes);
    if (!Number.isFinite(dur) || dur < 1) {
      return json({ success: false, error: "Duração inválida." }, 400);
    }
    const cleanNotes = notes ? sanitizeText(notes, 500) : null;

    // 5) Reusa cliente existente pelo telefone na barbearia, ou cria novo
    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("barbershop_id", barbershop_id)
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();

    let clientId = existingClient?.id as string | undefined;
    if (!clientId) {
      const { data: newClient, error: clientErr } = await admin
        .from("clients")
        .insert({ barbershop_id, name, phone, email })
        .select("id")
        .single();
      if (clientErr || !newClient) {
        console.error("[public-booking] cliente:", clientErr);
        return json({ success: false, error: "Não foi possível registrar o cliente." }, 500);
      }
      clientId = newClient.id;
    }

    // 6) Cria o agendamento (status sempre 'pending')
    const { data: appt, error: apptErr } = await admin
      .from("appointments")
      .insert({
        barbershop_id,
        professional_id,
        client_id: clientId,
        service_id,
        date,
        time,
        duration_minutes: dur,
        status: "pending",
        notes: cleanNotes,
      })
      .select("id")
      .single();

    if (apptErr || !appt) {
      console.error("[public-booking] agendamento:", apptErr);
      // Conflito do índice único (mesmo profissional/data/hora)
      if (apptErr?.code === "23505") {
        return json({ success: false, error: "Horário já ocupado, escolha outro." }, 409);
      }
      // Regras de negócio (triggers): dia fechado, fora do horário, overlap, rate limit
      const msg = apptErr?.message ?? "";
      if (/não funciona neste dia|fora do funcionamento|conflita|Limite de criação/i.test(msg)) {
        return json({ success: false, error: msg }, 422);
      }
      return json({ success: false, error: "Não foi possível concluir o agendamento." }, 400);
    }

    // 7) Sucesso — dispara confirmação WhatsApp em BACKGROUND (não bloqueia a
    // resposta do booking). Busca dados da mensagem e chama send-whatsapp.
    const sendConfirmation = async () => {
      try {
        const [shopRes, svcRes, profRes] = await Promise.all([
          admin.from("barbershops").select("name, phone").eq("id", barbershop_id).maybeSingle(),
          admin.from("services").select("name").eq("id", service_id).maybeSingle(),
          admin.from("professionals").select("name").eq("id", professional_id).maybeSingle(),
        ]);
        const [yy, mm, dd] = String(date).split("-");
        const dataBR = `${dd}/${mm}/${yy}`;
        const message =
          `Olá ${name}! 👋\n\n` +
          `Seu agendamento está confirmado! ✂️\n\n` +
          `🏪 Barbearia: ${shopRes.data?.name ?? ""}\n` +
          `📅 Data: ${dataBR}\n` +
          `⏰ Horário: ${time}\n` +
          `💈 Serviço: ${svcRes.data?.name ?? ""}\n` +
          `👤 Profissional: ${profRes.data?.name ?? ""}\n\n` +
          `Para cancelar ou reagendar, entre em contato:\n` +
          `📱 ${shopRes.data?.phone ?? ""}\n\n` +
          `Te esperamos!`;
        await admin.functions.invoke("send-whatsapp", { body: { phone, message } });
      } catch (e) {
        console.error("[public-booking] confirmação WhatsApp:", e);
      }
    };
    // EdgeRuntime é global no runtime Supabase; fallback fire-and-forget local.
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(sendConfirmation());
    else void sendConfirmation();

    return json({ success: true, appointment_id: appt.id }, 200);
  } catch (err) {
    console.error("[public-booking] erro inesperado:", err);
    return json({ success: false, error: "Não foi possível concluir o agendamento." }, 500);
  }
});
