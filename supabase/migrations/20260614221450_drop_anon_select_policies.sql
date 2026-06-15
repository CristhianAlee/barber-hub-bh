-- =============================================================
-- 20260614221450_drop_anon_select_policies.sql
-- Etapa 2 — remove as policies de SELECT anônimas que vazavam
-- dados entre contas (multi-tenant leak).
--
-- Pré-requisito: a migration aditiva 20260614211226_fix_anon_rls.sql
-- já deve estar aplicada (RPC get_booked_slots + views
-- public_barbershops/public_professionals) e o frontend já deve usar
-- esses objetos. Caso contrário, o link público de agendamento quebra.
--
-- Estas policies já foram aplicadas manualmente via SQL Editor e
-- validadas (ver SECURITY-FIX-PLAN.md › Validação). Esta migration
-- existe para o histórico refletir o estado real do banco.
-- =============================================================

-- appointments: anon não lê mais agendamentos diretamente.
-- O link público usa a RPC get_booked_slots (SECURITY DEFINER).
DROP POLICY IF EXISTS "appointments_public_read" ON appointments;

-- barbershops: anon lê apenas a view public_barbershops (sem owner_id).
DROP POLICY IF EXISTS "barbershops_public_read" ON barbershops;

-- professionals: anon lê apenas a view public_professionals (sem phone).
DROP POLICY IF EXISTS "professionals_public_read" ON professionals;
