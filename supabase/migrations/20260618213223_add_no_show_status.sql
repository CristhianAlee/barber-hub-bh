-- =============================================================
-- 20260618213223_add_no_show_status.sql
-- Sistema de "Cliente Faltou" (no-show). Aditivo, não altera RLS.
-- Rodar no SQL Editor do Supabase.
-- =============================================================

-- Adiciona 'no_show' ao CHECK de status de appointments.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Contador de faltas por cliente.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;