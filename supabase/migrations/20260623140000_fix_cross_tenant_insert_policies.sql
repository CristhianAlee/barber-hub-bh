-- =============================================================
-- 20260623140000_fix_cross_tenant_insert_policies.sql
--
-- BUG CRÍTICO: usuário autenticado (Conta A) inseriu appointment na
-- barbearia de outra conta (Conta B) — cross-tenant leak no INSERT.
--
-- CAUSA RAIZ REAL (correção do diagnóstico):
-- RLS é PERMISSIVO: numa operação, o row passa se QUALQUER policy
-- permissiva aplicável aprovar (OR). As policies *_anon_insert têm
-- WITH CHECK ( barbershop_exists(barbershop_id) ... ) — que é TRUE para
-- QUALQUER barbearia existente (é o que o link público precisa). Se essa
-- policy puder ser satisfeita por um request autenticado, o WITH CHECK
-- correto de *_owner_all NÃO bloqueia (policies permissivas se somam por
-- OR, não por AND). Resultado: insert cross-tenant aprovado (201).
--
-- NOTA: "FOR ALL aplica WITH CHECK só em UPDATE" é impreciso — FOR ALL
-- aplica WITH CHECK em INSERT também. O furo é a soma OR com a policy anon.
--
-- FIX DECISIVO (Parte B): tornar as policies anon estritamente anônimas
-- com `auth.uid() IS NULL`. Request anon real (anon key, sem JWT de user)
-- tem auth.uid() = NULL → continua funcionando. Request autenticado tem
-- auth.uid() = <user> → não satisfaz mais a policy anon.
--
-- Parte A: além disso, separamos *_owner_all (FOR ALL) em policies por
-- operação (boa prática; deixa o INSERT autenticado explícito).
--
-- Apenas clients e appointments têm policy anon de INSERT → só essas 2
-- tabelas são vulneráveis. As outras 9 (products, sales, sale_items,
-- stock_movements, financial_entries, fixed_costs, professionals,
-- services, business_hours) NÃO têm policy de INSERT separada, então o
-- authenticated só insere via *_owner_all (que checa ownership) — seguras.
-- =============================================================

-- =====================================================================
-- PARTE B (DECISIVA) — anon insert estritamente para anon (auth.uid() IS NULL)
-- =====================================================================

-- clients
DROP POLICY IF EXISTS "clients_anon_insert" ON clients;
CREATE POLICY "clients_anon_insert" ON clients
  FOR INSERT TO anon
  WITH CHECK (
    auth.uid() IS NULL
    AND public.barbershop_exists(barbershop_id)
  );

-- appointments
DROP POLICY IF EXISTS "appointments_anon_insert" ON appointments;
CREATE POLICY "appointments_anon_insert" ON appointments
  FOR INSERT TO anon
  WITH CHECK (
    auth.uid() IS NULL
    AND public.barbershop_exists(barbershop_id)
    AND date >= CURRENT_DATE
    AND status = 'pending'
  );

-- =====================================================================
-- PARTE A — separar *_owner_all (FOR ALL) em policies por operação
-- nas 2 tabelas que têm vetor de INSERT anon (appointments, clients).
-- =====================================================================

-- appointments ---------------------------------------------------------
DROP POLICY IF EXISTS "appointments_owner_all" ON appointments;

CREATE POLICY "appointments_owner_select" ON appointments
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

CREATE POLICY "appointments_owner_insert" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

CREATE POLICY "appointments_owner_update" ON appointments
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

CREATE POLICY "appointments_owner_delete" ON appointments
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- clients --------------------------------------------------------------
DROP POLICY IF EXISTS "clients_owner_all" ON clients;

CREATE POLICY "clients_owner_select" ON clients
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

CREATE POLICY "clients_owner_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

CREATE POLICY "clients_owner_update" ON clients
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

CREATE POLICY "clients_owner_delete" ON clients
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
