-- =============================================================
-- 20260618211828_fix_anon_insert_barbershop_exists.sql
--
-- BUG: insert anônimo em clients/appointments retorna
-- "new row violates row-level security policy" (401).
--
-- CAUSA: as policies *_anon_insert validam a barbearia com
--   WITH CHECK ( EXISTS (SELECT 1 FROM barbershops WHERE id = barbershop_id) )
-- Esse subselect roda COM O RLS do papel anon. Como a Etapa 2
-- (20260614221450) dropou "barbershops_public_read", o anon não
-- enxerga NENHUMA linha de barbershops → EXISTS = false → check falha.
--
-- FIX: trocar o EXISTS direto por uma função SECURITY DEFINER que
-- checa a existência IGNORANDO o RLS de barbershops, sem reexpor a
-- tabela ao anon (não reabre vazamento de owner_id).
-- =============================================================

CREATE OR REPLACE FUNCTION public.barbershop_exists(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM barbershops WHERE id = p_id);
$$;

REVOKE ALL ON FUNCTION public.barbershop_exists(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.barbershop_exists(UUID) TO anon, authenticated;

-- clients: existência via função definer.
DROP POLICY IF EXISTS "clients_anon_insert" ON clients;
CREATE POLICY "clients_anon_insert" ON clients
  FOR INSERT TO anon
  WITH CHECK ( public.barbershop_exists(barbershop_id) );

-- appointments: existência via função definer + regras já existentes.
DROP POLICY IF EXISTS "appointments_anon_insert" ON appointments;
CREATE POLICY "appointments_anon_insert" ON appointments
  FOR INSERT TO anon
  WITH CHECK (
    public.barbershop_exists(barbershop_id)
    AND date >= CURRENT_DATE
    AND status = 'pending'
  );
