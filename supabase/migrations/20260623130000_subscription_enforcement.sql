-- =============================================================
-- 20260623130000_subscription_enforcement.sql
-- Enforcement de assinatura no RLS: as 11 tabelas do painel só são
-- acessíveis (FOR ALL, role authenticated) quando o dono tem assinatura
-- ativa OU trial válido. Segunda camada além do PaywallGuard (frontend).
--
-- NÃO altera: barbershops_owner_all, policies anon (*_anon_insert,
-- services/business_hours/prof_services _public_read), views públicas,
-- RPC get_booked_slots, professional_services, professional_business_hours,
-- user_consents.
--
-- IMPORTANTE: stock_movements e sale_items NÃO têm coluna barbershop_id —
-- usam subquery (product_id/sale_id). financial_entries e stock_movements
-- têm nomes de policy históricos (financial_owner_all / stock_owner_all),
-- por isso os DROPs usam os nomes REAIS (e também o nome no padrão, defensivo).
-- =============================================================

-- ETAPA 1 — função de checagem de assinatura ativa
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM barbershops
    WHERE owner_id = auth.uid()
    AND (
      subscription_status = 'active'
      OR (
        subscription_status = 'trial'
        AND trial_ends_at > NOW()
      )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION has_active_subscription() TO authenticated;

-- ETAPA 2 — recriar as policies *_owner_all exigindo assinatura ativa.

-- business_hours -----------------------------------------------------------
DROP POLICY IF EXISTS "business_hours_owner_all" ON business_hours;
CREATE POLICY "business_hours_owner_all" ON business_hours
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- professionals ------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_owner_all" ON professionals;
CREATE POLICY "professionals_owner_all" ON professionals
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- services -----------------------------------------------------------------
DROP POLICY IF EXISTS "services_owner_all" ON services;
CREATE POLICY "services_owner_all" ON services
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- clients ------------------------------------------------------------------
DROP POLICY IF EXISTS "clients_owner_all" ON clients;
CREATE POLICY "clients_owner_all" ON clients
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- appointments -------------------------------------------------------------
DROP POLICY IF EXISTS "appointments_owner_all" ON appointments;
CREATE POLICY "appointments_owner_all" ON appointments
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- products -----------------------------------------------------------------
DROP POLICY IF EXISTS "products_owner_all" ON products;
CREATE POLICY "products_owner_all" ON products
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- stock_movements (sem barbershop_id — via product_id; nome real: stock_owner_all)
DROP POLICY IF EXISTS "stock_owner_all" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_all" ON stock_movements; -- defensivo
CREATE POLICY "stock_owner_all" ON stock_movements
  FOR ALL TO authenticated
  USING (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  )
  WITH CHECK (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );

-- sales --------------------------------------------------------------------
DROP POLICY IF EXISTS "sales_owner_all" ON sales;
CREATE POLICY "sales_owner_all" ON sales
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- sale_items (sem barbershop_id — via sale_id)
DROP POLICY IF EXISTS "sale_items_owner_all" ON sale_items;
CREATE POLICY "sale_items_owner_all" ON sale_items
  FOR ALL TO authenticated
  USING (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  )
  WITH CHECK (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );

-- financial_entries (nome real: financial_owner_all)
DROP POLICY IF EXISTS "financial_owner_all" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_all" ON financial_entries; -- defensivo
CREATE POLICY "financial_owner_all" ON financial_entries
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- fixed_costs --------------------------------------------------------------
DROP POLICY IF EXISTS "fixed_costs_owner_all" ON fixed_costs;
CREATE POLICY "fixed_costs_owner_all" ON fixed_costs
  FOR ALL TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
