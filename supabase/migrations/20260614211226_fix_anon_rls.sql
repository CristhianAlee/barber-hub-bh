-- =============================================================
-- 20260614211226_fix_anon_rls.sql
-- Correção de RLS anônimo — PARTE ADITIVA (não quebra nada).
--
-- Esta migration SÓ adiciona objetos novos e endurece os INSERTs
-- anônimos. Os 3 DROP POLICY finais (appointments_public_read,
-- barbershops_public_read, professionals_public_read) NÃO estão
-- aqui — ver SECURITY-FIX-PLAN.md › "Etapa 2", aplicar só após
-- o frontend novo estar testado localmente.
-- =============================================================

-- -------------------------------------------------------------
-- CORREÇÃO 1 — appointments
-- -------------------------------------------------------------

-- RPC de horários ocupados (variante 2 args). Retorna professional_id
-- para suportar o fluxo "sem preferência" sem N chamadas, mantendo o
-- filtro por profissional em JS idêntico ao atual. NÃO expõe client_id,
-- notes nem dados de outras barbearias (escopo por p_barbershop_id).
CREATE OR REPLACE FUNCTION get_booked_slots(
  p_barbershop_id UUID,
  p_date DATE
)
RETURNS TABLE (
  professional_id UUID,
  "time" TIME,
  duration_minutes INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT professional_id, "time", duration_minutes
  FROM appointments
  WHERE barbershop_id = p_barbershop_id
    AND date = p_date
    AND status <> 'cancelled';
$$;

REVOKE ALL ON FUNCTION get_booked_slots(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_booked_slots(UUID, DATE) TO anon, authenticated;

-- INSERT anônimo restrito (substitui o WITH CHECK (true)).
DROP POLICY IF EXISTS "appointments_anon_insert" ON appointments;
CREATE POLICY "appointments_anon_insert" ON appointments
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM barbershops WHERE id = barbershop_id)
    AND date >= CURRENT_DATE
    AND status = 'pending'
  );

-- -------------------------------------------------------------
-- CORREÇÃO 2 — barbershops (view pública sem owner_id)
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW public_barbershops
WITH (security_invoker = false) AS
SELECT id, name, slug, phone, address, logo_url,
       booking_interval_minutes, max_advance_days, onboarded
FROM barbershops;

GRANT SELECT ON public_barbershops TO anon, authenticated;

-- -------------------------------------------------------------
-- CORREÇÃO 3 — professionals (view pública sem phone)
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW public_professionals
WITH (security_invoker = false) AS
SELECT id, barbershop_id, name, avatar_url, active
FROM professionals
WHERE active = true;

GRANT SELECT ON public_professionals TO anon, authenticated;

-- -------------------------------------------------------------
-- CORREÇÃO 4 — clients (validar insert anônimo)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "clients_anon_insert" ON clients;
CREATE POLICY "clients_anon_insert" ON clients
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM barbershops WHERE id = barbershop_id)
  );
