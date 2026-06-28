-- =============================================================
-- 20260623150000_fix_owner_insert_policies.sql
--
-- Defesa em profundidade contra INSERT cross-tenant autenticado:
-- separar TODAS as 11 policies *_owner_all (FOR ALL) em policies
-- explícitas por operação (SELECT/INSERT/UPDATE/DELETE), garantindo
-- que o INSERT tem WITH CHECK EXPLÍCITO (não herdado do FOR ALL).
--
-- NOTA TÉCNICA (precisão): em PostgreSQL, FOR ALL COM WITH CHECK
-- explícito JÁ valida o INSERT — appointments/clients foram separadas
-- em 20260623140000 e as outras 9 receberam WITH CHECK explícito em
-- 20260623130000. Esta migration torna o INSERT explícito por operação
-- em TODAS as 11 (remove ambiguidade e qualquer policy FOR ALL residual).
--
-- Idempotente: dropa o nome FOR ALL (nomes REAIS, incl. stock_owner_all
-- e financial_owner_all) E as 4 policies por operação antes de recriar.
--
-- NÃO altera: policies anon (*_anon_insert), barbershops_owner_all,
-- user_consents, professional_services, professional_business_hours.
-- =============================================================

-- ============ appointments (barbershop_id direto) ============
DROP POLICY IF EXISTS "appointments_owner_all" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_select" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_update" ON appointments;
DROP POLICY IF EXISTS "appointments_owner_delete" ON appointments;
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

-- ============ clients (barbershop_id direto) ============
DROP POLICY IF EXISTS "clients_owner_all" ON clients;
DROP POLICY IF EXISTS "clients_owner_select" ON clients;
DROP POLICY IF EXISTS "clients_owner_insert" ON clients;
DROP POLICY IF EXISTS "clients_owner_update" ON clients;
DROP POLICY IF EXISTS "clients_owner_delete" ON clients;
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

-- ============ financial_entries (barbershop_id direto; nome real: financial_owner_all) ============
DROP POLICY IF EXISTS "financial_owner_all" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_all" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_select" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_insert" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_update" ON financial_entries;
DROP POLICY IF EXISTS "financial_entries_owner_delete" ON financial_entries;
CREATE POLICY "financial_entries_owner_select" ON financial_entries
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "financial_entries_owner_insert" ON financial_entries
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "financial_entries_owner_update" ON financial_entries
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "financial_entries_owner_delete" ON financial_entries
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ products (barbershop_id direto) ============
DROP POLICY IF EXISTS "products_owner_all" ON products;
DROP POLICY IF EXISTS "products_owner_select" ON products;
DROP POLICY IF EXISTS "products_owner_insert" ON products;
DROP POLICY IF EXISTS "products_owner_update" ON products;
DROP POLICY IF EXISTS "products_owner_delete" ON products;
CREATE POLICY "products_owner_select" ON products
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "products_owner_insert" ON products
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "products_owner_update" ON products
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "products_owner_delete" ON products
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ sales (barbershop_id direto) ============
DROP POLICY IF EXISTS "sales_owner_all" ON sales;
DROP POLICY IF EXISTS "sales_owner_select" ON sales;
DROP POLICY IF EXISTS "sales_owner_insert" ON sales;
DROP POLICY IF EXISTS "sales_owner_update" ON sales;
DROP POLICY IF EXISTS "sales_owner_delete" ON sales;
CREATE POLICY "sales_owner_select" ON sales
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "sales_owner_insert" ON sales
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "sales_owner_update" ON sales
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "sales_owner_delete" ON sales
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ sale_items (SEM barbershop_id — via sale_id) ============
DROP POLICY IF EXISTS "sale_items_owner_all" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_select" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_insert" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_update" ON sale_items;
DROP POLICY IF EXISTS "sale_items_owner_delete" ON sale_items;
CREATE POLICY "sale_items_owner_select" ON sale_items
  FOR SELECT TO authenticated
  USING (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "sale_items_owner_insert" ON sale_items
  FOR INSERT TO authenticated
  WITH CHECK (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "sale_items_owner_update" ON sale_items
  FOR UPDATE TO authenticated
  USING (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  )
  WITH CHECK (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "sale_items_owner_delete" ON sale_items
  FOR DELETE TO authenticated
  USING (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );

-- ============ stock_movements (SEM barbershop_id — via product_id; nome real: stock_owner_all) ============
DROP POLICY IF EXISTS "stock_owner_all" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_all" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_select" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_insert" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_update" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_owner_delete" ON stock_movements;
CREATE POLICY "stock_movements_owner_select" ON stock_movements
  FOR SELECT TO authenticated
  USING (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "stock_movements_owner_insert" ON stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "stock_movements_owner_update" ON stock_movements
  FOR UPDATE TO authenticated
  USING (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  )
  WITH CHECK (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
    AND has_active_subscription()
  );
CREATE POLICY "stock_movements_owner_delete" ON stock_movements
  FOR DELETE TO authenticated
  USING (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
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
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "fixed_costs_owner_insert" ON fixed_costs
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "fixed_costs_owner_update" ON fixed_costs
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "fixed_costs_owner_delete" ON fixed_costs
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ professionals (barbershop_id direto) ============
DROP POLICY IF EXISTS "professionals_owner_all" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_select" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_insert" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_update" ON professionals;
DROP POLICY IF EXISTS "professionals_owner_delete" ON professionals;
CREATE POLICY "professionals_owner_select" ON professionals
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "professionals_owner_insert" ON professionals
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "professionals_owner_update" ON professionals
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "professionals_owner_delete" ON professionals
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ services (barbershop_id direto) ============
DROP POLICY IF EXISTS "services_owner_all" ON services;
DROP POLICY IF EXISTS "services_owner_select" ON services;
DROP POLICY IF EXISTS "services_owner_insert" ON services;
DROP POLICY IF EXISTS "services_owner_update" ON services;
DROP POLICY IF EXISTS "services_owner_delete" ON services;
CREATE POLICY "services_owner_select" ON services
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "services_owner_insert" ON services
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "services_owner_update" ON services
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "services_owner_delete" ON services
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());

-- ============ business_hours (barbershop_id direto) ============
DROP POLICY IF EXISTS "business_hours_owner_all" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_select" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_insert" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_update" ON business_hours;
DROP POLICY IF EXISTS "business_hours_owner_delete" ON business_hours;
CREATE POLICY "business_hours_owner_select" ON business_hours
  FOR SELECT TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "business_hours_owner_insert" ON business_hours
  FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "business_hours_owner_update" ON business_hours
  FOR UPDATE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription())
  WITH CHECK (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
CREATE POLICY "business_hours_owner_delete" ON business_hours
  FOR DELETE TO authenticated
  USING (barbershop_id = get_user_barbershop_id() AND has_active_subscription());
