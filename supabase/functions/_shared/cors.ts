// CORS compartilhado pelas Edge Functions invocadas pelo frontend.
// Restrito às origens conhecidas (produção + dev local) em vez de "*".
const allowedOrigins = [
  "https://barber-hub-rho.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

export function corsHeaders(origin?: string | null) {
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
