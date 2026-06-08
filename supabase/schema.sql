-- =============================================
-- BARBERHUB — SCHEMA COMPLETO
-- Execute no Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS
-- =============================================

CREATE TABLE IF NOT EXISTS barbershops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  booking_interval_minutes INTEGER DEFAULT 30,
  max_advance_days INTEGER DEFAULT 30,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT barbershops_owner_unique UNIQUE (owner_id)
);

CREATE TABLE IF NOT EXISTS business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TEXT NOT NULL DEFAULT '08:00',
  close_time TEXT NOT NULL DEFAULT '20:00',
  is_closed BOOLEAN DEFAULT false,
  UNIQUE (barbershop_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS professional_business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TEXT NOT NULL DEFAULT '08:00',
  close_time TEXT NOT NULL DEFAULT '20:00',
  is_closed BOOLEAN DEFAULT false,
  UNIQUE (professional_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_services (
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (professional_id, service_id)
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  last_visit TIMESTAMPTZ,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX appointments_no_double_booking
  ON appointments (professional_id, date, time)
  WHERE status != 'cancelled';

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  cost DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_alert INTEGER DEFAULT 5 CHECK (min_stock_alert >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('cash','pix','debit','credit','transfer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('service','product')),
  item_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT,
  date DATE NOT NULL,
  recurring BOOLEAN DEFAULT false,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_appointments_barbershop_date ON appointments (barbershop_id, date);
CREATE INDEX idx_appointments_professional ON appointments (professional_id, date);
CREATE INDEX idx_clients_barbershop ON clients (barbershop_id);
CREATE INDEX idx_clients_phone ON clients (barbershop_id, phone);
CREATE INDEX idx_financial_barbershop_date ON financial_entries (barbershop_id, date);
CREATE INDEX idx_products_barbershop ON products (barbershop_id);
CREATE INDEX idx_stock_movements_product ON stock_movements (product_id, created_at);

-- =============================================
-- RLS — ROW LEVEL SECURITY
-- =============================================

ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_barbershop_id()
RETURNS UUID AS $$
  SELECT id FROM barbershops WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- BARBERSHOPS
CREATE POLICY "barbershops_owner_all" ON barbershops
  FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "barbershops_public_read" ON barbershops
  FOR SELECT TO anon USING (true);

-- BUSINESS_HOURS
CREATE POLICY "business_hours_owner_all" ON business_hours
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "business_hours_public_read" ON business_hours
  FOR SELECT TO anon USING (true);

-- PROFESSIONAL_BUSINESS_HOURS
CREATE POLICY "prof_hours_owner_all" ON professional_business_hours
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "prof_hours_public_read" ON professional_business_hours
  FOR SELECT TO anon USING (true);

-- PROFESSIONALS
CREATE POLICY "professionals_owner_all" ON professionals
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "professionals_public_read" ON professionals
  FOR SELECT TO anon USING (active = true);

-- SERVICES
CREATE POLICY "services_owner_all" ON services
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "services_public_read" ON services
  FOR SELECT TO anon USING (active = true);

-- PROFESSIONAL_SERVICES
CREATE POLICY "prof_services_owner_all" ON professional_services
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "prof_services_public_read" ON professional_services
  FOR SELECT TO anon USING (true);

-- CLIENTS
CREATE POLICY "clients_owner_all" ON clients
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "clients_anon_insert" ON clients
  FOR INSERT TO anon WITH CHECK (true);

-- APPOINTMENTS
CREATE POLICY "appointments_owner_all" ON appointments
  FOR ALL USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "appointments_public_read" ON appointments
  FOR SELECT TO anon USING (true);
CREATE POLICY "appointments_anon_insert" ON appointments
  FOR INSERT TO anon WITH CHECK (true);

-- PRODUCTS
CREATE POLICY "products_owner_all" ON products
  FOR ALL USING (barbershop_id = get_user_barbershop_id());

-- STOCK_MOVEMENTS
CREATE POLICY "stock_owner_all" ON stock_movements
  FOR ALL USING (
    product_id IN (SELECT id FROM products WHERE barbershop_id = get_user_barbershop_id())
  );

-- SALES
CREATE POLICY "sales_owner_all" ON sales
  FOR ALL USING (barbershop_id = get_user_barbershop_id());

-- SALE_ITEMS
CREATE POLICY "sale_items_owner_all" ON sale_items
  FOR ALL USING (
    sale_id IN (SELECT id FROM sales WHERE barbershop_id = get_user_barbershop_id())
  );

-- FINANCIAL_ENTRIES
CREATE POLICY "financial_owner_all" ON financial_entries
  FOR ALL USING (barbershop_id = get_user_barbershop_id());

-- FIXED_COSTS
CREATE POLICY "fixed_costs_owner_all" ON fixed_costs
  FOR ALL USING (barbershop_id = get_user_barbershop_id());

-- =============================================
-- TRIGGER: atualiza stats do cliente ao concluir
-- =============================================
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE clients
    SET
      total_visits = total_visits + 1,
      last_visit = NOW(),
      total_spent = total_spent + (
        SELECT COALESCE(SUM(si.unit_price * si.quantity), 0)
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.appointment_id = NEW.id
      )
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_completed
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- =============================================
-- LGPD: Consentimentos de usuário
-- =============================================
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  terms_version TEXT NOT NULL DEFAULT '2025-06',
  marketing_consent BOOLEAN DEFAULT false,
  cookie_consent TEXT DEFAULT 'essential-only',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consents_owner" ON user_consents
  FOR ALL USING (user_id = auth.uid());

-- =============================================
-- STORAGE: execute no Supabase Dashboard
-- Storage > New Bucket > "logos" > Public: ON
-- =============================================
