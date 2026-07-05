-- 20260628200000_add_reminder_sent.sql
-- Coluna de controle para o job de lembrete WhatsApp (whatsapp-reminders).
-- Aditiva e idempotente. Não altera RLS nem policies.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
