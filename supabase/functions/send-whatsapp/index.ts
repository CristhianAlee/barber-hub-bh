// supabase/functions/send-whatsapp/index.ts
// Envia uma mensagem de texto via Z-API. Chamada INTERNA (por outras Edge
// Functions com service_role) — NÃO deve ser chamada pelo frontend.
// Deploy SEM --no-verify-jwt: exige JWT válido (service_role) para chamar.
// Credenciais Z-API vêm SÓ de Deno.env (nunca no código / nunca no frontend).

const ZAPI_BASE_URL = Deno.env.get("ZAPI_BASE_URL") ?? "https://api.z-api.io";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ success: false, error: "Método não permitido." }, 405);
  }

  let payload: { phone?: unknown; message?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: "Requisição inválida." }, 400);
  }

  const { phone, message } = payload ?? {};
  if (!phone || !message) {
    return json({ success: false, error: "phone e message são obrigatórios." }, 400);
  }

  const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const accountToken = Deno.env.get("ZAPI_ACCOUNT_TOKEN"); // opcional (header de segurança da conta)
  if (!instanceId || !clientToken) {
    console.error("[send-whatsapp] credenciais Z-API ausentes (ZAPI_INSTANCE_ID / ZAPI_CLIENT_TOKEN)");
    return json({ success: false, error: "Serviço de mensagens indisponível." }, 500);
  }

  // Formata o número: só dígitos, garante DDI 55 (Brasil).
  let digits = String(phone).replace(/\D/g, "");
  if (!digits.startsWith("55")) digits = "55" + digits;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Se a conta Z-API tiver "Token de segurança da conta" habilitado, envia no header.
    if (accountToken) headers["Client-Token"] = accountToken;

    const resp = await fetch(
      `${ZAPI_BASE_URL}/instances/${instanceId}/token/${clientToken}/send-text`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ phone: digits, message: String(message) }),
      },
    );

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[send-whatsapp] Z-API erro:", resp.status, text.slice(0, 300));
      return json({ success: false, error: "Falha ao enviar mensagem." }, 502);
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error("[send-whatsapp] erro inesperado:", err);
    return json({ success: false, error: "Falha ao enviar mensagem." }, 500);
  }
});
