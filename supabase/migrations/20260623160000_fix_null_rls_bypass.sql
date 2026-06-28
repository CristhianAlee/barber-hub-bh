-- =============================================================
-- 20260623160000_fix_null_rls_bypass.sql
--
-- Defesa em profundidade: guard explícito de NULL em todas as policies
-- *_owner_* das 11 tabelas + COALESCE em has_active_subscription().
--
-- NOTA DE PRECISÃO (importante): em RLS do PostgreSQL, USING/WITH CHECK
-- usam semântica "is true" — NULL e FALSE ambos REJEITAM a linha. Logo
-- `barbershop_id = get_user_barbershop_id()` com função retornando NULL
-- JÁ bloqueia (não há bypass por NULL em RLS; isso só ocorreria em CHECK
-- constraint de tabela). Os guards abaixo são redundância defensiva e
-- documentam a intenção; não mudam o resultado de segurança.
--
-- NÃO altera: policies anon, barbershops_owner_all, user_consents.
-- =============================================================

-- ---- Funções: nunca retornar NULL onde se espera boolean ----

-- has_active_subscription: EXISTS já é sempre true/false; COALESCE é
-- redundante mas explícito (garante FALSE, nunca NULL).
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1 FROM barbershops
      WHERE owner_id = auth.uid()
      AND (
        subscription_status = 'active'
        OR (subscription_status = 'trial' AND trial_ends_at > NOW())
      )
    ),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION has_active_subscription() TO authenticated;

-- get_user_barbershop_id: pode retornar NULL (usuário sem barbearia).
-- NULL é esperado e tratado nas policies com `IS NOT NULL`.
CREATE OR REPLACE FUNCTION get_user_barbershop_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  -- Retorna NULL quando o usuário não tem barbearia. As policies RLS
  -- exigem `get_user_barbershop_id() IS NOT NULL` antes de comparar.
  SELECT id FROM barbershops WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- ===================== 11 tabelas × 4 operações =====================

-- ============ appointments (barbershop_id direto) ============
DROP POLICY IF EXISTS "appointments_owner_all" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_select" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_update" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_delete" ON appointments;
CREATE POLICY "appointments_owner_select" ON appointments
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "appointments_owner_insert" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "appointments_owner_update" ON appointments
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "appointments_owner_delete" ON appointments
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ clients (barbershop_id direto) ============
DROP POLICY IF EXISTS "clients_owner_all" ON clients;
DROP POLICY IF EXISTS "clients_owner_select" ON clients;
DROP POLICY IF EXISTS "clients_owner_insert" ON clients;
DROP POLICY IF EXISTS "clients_owner_update" ON clients;
DROP POLICY IF EXISTS "clients_owner_delete" ON clients;
CREATE POLICY "clients_owner_select" ON clients
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "clients_owner_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "clients_owner_update" ON clients
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "clients_owner_delete" ON clients
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ financial_entries (barbershop_id direto) ============
DROP POLICY IF EXISTS "financial_owner_all" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_all" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_select" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_insert" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_update" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_delete" ON financial_entries;
CREATE POLICY "financial_entries_owner_select" ON financial_entries
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "financial_entries_owner_insert" ON financial_entries
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "financial_entries_owner_update" ON financial_entries
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "financial_entries_owner_delete" ON financial_entries
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ products (barbershop_id direto) ============
DROP POLICY IF EXISTS "products_owner_all" ON products;
DROP POLICY IF EXISTS "products_owner_select" ON products;
DROP POLICY IF EXISTS "products_owner_insert" ON products;
DROP POLICY IF EXISTS "products_owner_update" ON products;
DROP POLICY IF EXISTS "products_owner_delete" ON products;
CREATE POLICY "products_owner_select" ON products
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "products_owner_insert" ON products
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "products_owner_update" ON products
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "products_owner_delete" ON products
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ sales (barbershop_id direto) ============
DROP POLICY IF EXISTS "sales_owner_all" ON sales;
DROP POLICY IF EXISTS "sales_owner_select" ON sales;
DROP POLICY IF EXISTS "sales_owner_insert" ON sales;
DROP POLICY IF EXISTS "sales_owner_update" ON sales;
DROP POLICY IF EXISTS "sales_owner_delete" ON sales;
CREATE POLICY "sales_owner_select" ON sales
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "sales_owner_insert" ON sales
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "sales_owner_update" ON sales
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "sales_owner_delete" ON sales
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ sale_items (via sale_id subquery) ============
DROP POLICY IF EXISTS "sale_items_owner_all" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_select" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_insert" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_update" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_delete" ON sale_items;
CREATE POLICY "sale_items_owner_select" ON sale_items
  FOR SELECT TO authenticated
  USING (
    get_user_barbershop_id() IS NOT NULL
    AND sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "sale_items_owner_insert" ON sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_barbershop_id() IS NOT NULL
    AND sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "sale_items_owner_update" ON sale_items
  FOR UPDATE TO authenticated
  USING (
    get_user_barbershop_id() IS NOT NULL
    AND sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  )
  WITH CHECK (
    get_user_barbershop_id() IS NOT NULL
    AND sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "sale_items_owner_delete" ON sale_items
  FOR DELETE TO authenticated
  USING (
    get_user_barbershop_id() IS NOT NULL
    AND sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );

-- ============ stock_movements (via product_id subquery) ============
DROP POLICY IF EXISTS "stock_owner_all" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_all" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_select" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_insert" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_update" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_delete" ON stock_movements;
CREATE POLICY "stock_movements_owner_select" ON stock_movements
  FOR SELECT TO authenticated
  USING (
    get_user_barbershop_id() IS NOT NULL
    AND product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "stock_movements_owner_insert" ON stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_barbershop_id() IS NOT NULL
    AND product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "stock_movements_owner_update" ON stock_movements
  FOR UPDATE TO authenticated
  USING (
    get_user_barbershop_id() IS NOT NULL
    AND product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  )
  WITH CHECK (
    get_user_barbershop_id() IS NOT NULL
    AND product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "stock_movements_owner_delete" ON stock_movements
  FOR DELETE TO authenticated
  USING (
    get_user_barbershop_id() IS NOT NULL
    AND product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );

-- ============ fixed_costs (barbershop_id direto) ============
DROP POLICY IF EXISTS "fixed_costs_owner_all" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_owner_select" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_owner_insert" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_owner_update" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_owner_delete" ON fixed_costs;
CREATE POLICY "fixed_costs_owner_select" ON fixed_costs
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "fixed_costs_owner_insert" ON fixed_costs
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "fixed_costs_owner_update" ON fixed_costs
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "fixed_costs_owner_delete" ON fixed_costs
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ professionals (barbershop_id direto) ============
DROP POLICY IF EXISTS "professionals_owner_all" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_select" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_insert" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_update" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_delete" ON professionals;
CREATE POLICY "professionals_owner_select" ON professionals
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "professionals_owner_insert" ON professionals
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "professionals_owner_update" ON professionals
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "professionals_owner_delete" ON professionals
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ services (barbershop_id direto) ============
DROP POLICY IF EXISTS "services_owner_all" ON services;
DROP POLICY IF EXISTS "services_owner_select" ON services;
DROP POLICY IF EXISTS "services_owner_insert" ON services;
DROP POLICY IF EXISTS "services_owner_update" ON services;
DROP POLICY IF EXISTS "services_owner_delete" ON services;
CREATE POLICY "services_owner_select" ON services
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "services_owner_insert" ON services
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "services_owner_update" ON services
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "services_owner_delete" ON services
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ business_hours (barbershop_id direto) ============
DROP POLICY IF EXISTS "business_hours_owner_all" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_select" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_insert" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_update" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_delete" ON business_hours;
CREATE POLICY "business_hours_owner_select" ON business_hours
  FOR SELECT TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "business_hours_owner_insert" ON business_hours
  FOR INSERT TO authenticated
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "business_hours_owner_update" ON business_hours
  FOR UPDATE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "business_hours_owner_delete" ON business_hours
  FOR DELETE TO authenticated
  USING (get_user_barbershop_id() IS NOT NULL AND barbershop_id = get_user_barbershop_id() AND has_active_subscription());
