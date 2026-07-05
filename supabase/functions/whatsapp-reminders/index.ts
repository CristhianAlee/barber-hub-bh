// supabase/functions/whatsapp-reminders/index.ts
// Job chamado a cada 5 min (pg_cron) — envia lembrete ~1h antes do agendamento.
// Chamado com service_role (via net.http_post do cron). Não é chamado do browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Fuso do agendamento: os horários são armazenados em horário local (Brasil).
// Brasil não usa mais horário de verão desde 2019 → UTC-3 fixo.
const BRT_OFFSET_MIN = -180;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // "Agora" no fuso do Brasil, e a janela [+55min, +65min].
  const nowBrt = new Date(Date.now() + BRT_OFFSET_MIN * 60000);
  const loBrt = new Date(nowBrt.getTime() + 55 * 60000);
  const hiBrt = new Date(nowBrt.getTime() + 65 * 60000);

  const today = nowBrt.toISOString().slice(0, 10);   // YYYY-MM-DD
  const loHM = loBrt.toISOString().slice(11, 16);     // HH:MM
  const hiHM = hiBrt.toISOString().slice(11, 16);     // HH:MM

  // Se a janela cruzar a meia-noite, ignora nesta rodada (raro; barbearia fechada).
  if (loHM > hiHM) {
    return json({ success: true, sent: 0, skipped: "janela cruza meia-noite" }, 200);
  }

  const { data: appts, error } = await admin
    .from("appointments")
    .select("id, time, date, clients(name, phone), barbershops(name), services(name)")
    .eq("date", today)
    .in("status", ["pending", "confirmed"])
    .eq("reminder_sent", false)
    .gte("time", `${loHM}:00`)
    .lte("time", `${hiHM}:59`);

  if (error) {
    console.error("[whatsapp-reminders] busca:", error);
    return json({ success: false, error: "Falha ao buscar agendamentos." }, 500);
  }

  let sent = 0;
  for (const a of appts ?? []) {
    const client = (a as any).clients;
    const shop = (a as any).barbershops;
    const svc = (a as any).services;
    const phone = client?.phone;
    if (!phone) continue;

    const message =
      `Olá ${client?.name ?? ""}! ⏰\n\n` +
      `Lembrete: você tem um agendamento em *1 hora*!\n\n` +
      `🏪 ${shop?.name ?? ""}\n` +
      `⏰ ${String(a.time).slice(0, 5)}\n` +
      `💈 ${svc?.name ?? ""}\n\n` +
      `Te esperamos! ✂️`;

    try {
      await admin.functions.invoke("send-whatsapp", { body: { phone, message } });
      sent++;
    } catch (e) {
      console.error("[whatsapp-reminders] envio falhou p/ appt", a.id, e);
    }

    // Marca como enviado (at-most-once — evita reenvio na próxima rodada).
    await admin.from("appointments").update({ reminder_sent: true }).eq("id", a.id);
  }

  return json({ success: true, sent, found: appts?.length ?? 0 }, 200);
});
