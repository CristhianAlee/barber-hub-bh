-- CRON_SETUP.sql — configuração do pg_cron para o job whatsapp-reminders.
--
-- ⚠️ NÃO é uma migration automática. Rode MANUALMENTE no SQL Editor DEPOIS de:
--   1) deployar a função whatsapp-reminders,
--   2) aplicar a migration 20260628200000_add_reminder_sent.sql,
--   3) setar os secrets Z-API.
--
-- Substitua os PLACEHOLDERS antes de rodar:
--   [SUPABASE_URL]      → https://ntjwaphcvosrekfzuvgc.supabase.co
--   [SERVICE_ROLE_KEY]  → a service_role key do projeto (NÃO commitar)
--
-- Requer as extensões pg_cron e pg_net habilitadas
-- (Dashboard → Database → Extensions).

-- Habilitar extensões (se ainda não estiverem):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'whatsapp-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := '[SUPABASE_URL]/functions/v1/whatsapp-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para conferir / remover depois:
-- SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'whatsapp-reminders';
-- SELECT cron.unschedule('whatsapp-reminders');
