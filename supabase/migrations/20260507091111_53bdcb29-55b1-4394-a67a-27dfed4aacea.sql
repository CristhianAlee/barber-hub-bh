
-- ============ ENUMS ============
CREATE TYPE appointment_status AS ENUM ('pending','confirmed','completed','cancelled');
CREATE TYPE movement_type AS ENUM ('in','out');
CREATE TYPE sale_item_type AS ENUM ('service','product');
CREATE TYPE entry_type AS ENUM ('income','expense');
CREATE TYPE payment_method AS ENUM ('cash','pix','debit','credit');

-- ============ BARBERSHOPS ============
CREATE TABLE public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  cover_url TEXT,
  booking_interval_minutes INTEGER NOT NULL DEFAULT 30,
  max_advance_days INTEGER NOT NULL DEFAULT 30,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_barbershops_owner ON public.barbershops(owner_id);
CREATE INDEX idx_barbershops_slug ON public.barbershops(slug);

-- ============ BUSINESS HOURS ============
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  is_closed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(barbershop_id, day_of_week)
);

-- ============ PROFESSIONALS ============
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  specialties TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_professionals_barbershop ON public.professionals(barbershop_id);

-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_barbershop ON public.services(barbershop_id);

-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  last_visit TIMESTAMPTZ,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, phone)
);
CREATE INDEX idx_clients_barbershop ON public.clients(barbershop_id);

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_bs_date ON public.appointments(barbershop_id, date);
CREATE INDEX idx_appointments_prof_date ON public.appointments(professional_id, date);

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_barbershop ON public.products(barbershop_id);

-- ============ STOCK MOVEMENTS ============
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ SALES ============
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sales_barbershop ON public.sales(barbershop_id, created_at DESC);

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  type sale_item_type NOT NULL,
  item_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============ FINANCIAL ENTRIES ============
CREATE TABLE public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  type entry_type NOT NULL,
  category TEXT,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_barbershop_date ON public.financial_entries(barbershop_id, date DESC);

-- ============ HELPER FUNCTION ============
CREATE OR REPLACE FUNCTION public.user_owns_barbershop(_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = _barbershop_id AND owner_id = auth.uid()
  )
$$;

-- ============ RLS ============
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

-- BARBERSHOPS — owner full access + public can read by slug (limited via view? we expose name/slug only via app)
CREATE POLICY "Owner manages own barbershop" ON public.barbershops
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Public can read barbershops for booking" ON public.barbershops
  FOR SELECT TO anon, authenticated USING (true);

-- BUSINESS HOURS
CREATE POLICY "Owner manages business hours" ON public.business_hours
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));
CREATE POLICY "Public reads business hours" ON public.business_hours
  FOR SELECT TO anon, authenticated USING (true);

-- PROFESSIONALS
CREATE POLICY "Owner manages professionals" ON public.professionals
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));
CREATE POLICY "Public reads active professionals" ON public.professionals
  FOR SELECT TO anon, authenticated USING (active = true);

-- SERVICES
CREATE POLICY "Owner manages services" ON public.services
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));
CREATE POLICY "Public reads active services" ON public.services
  FOR SELECT TO anon, authenticated USING (active = true);

-- CLIENTS — owner only, plus anon insert for public booking
CREATE POLICY "Owner manages clients" ON public.clients
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));
CREATE POLICY "Public can insert client for booking" ON public.clients
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- APPOINTMENTS — owner full + public can insert + public can read times for availability
CREATE POLICY "Owner manages appointments" ON public.appointments
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));
CREATE POLICY "Public can insert appointment" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "Public reads appointment slots" ON public.appointments
  FOR SELECT TO anon, authenticated USING (status IN ('pending','confirmed'));

-- PRODUCTS
CREATE POLICY "Owner manages products" ON public.products
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));

-- STOCK MOVEMENTS — via product ownership
CREATE POLICY "Owner manages stock movements" ON public.stock_movements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.user_owns_barbershop(p.barbershop_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND public.user_owns_barbershop(p.barbershop_id))
  );

-- SALES + ITEMS
CREATE POLICY "Owner manages sales" ON public.sales
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));
CREATE POLICY "Owner manages sale items" ON public.sale_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.user_owns_barbershop(s.barbershop_id))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.user_owns_barbershop(s.barbershop_id))
  );

-- FINANCIAL ENTRIES
CREATE POLICY "Owner manages financial entries" ON public.financial_entries
  FOR ALL USING (public.user_owns_barbershop(barbershop_id))
  WITH CHECK (public.user_owns_barbershop(barbershop_id));

-- ============ TRIGGERS ============
-- Auto-create barbershop on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT;
  v_slug TEXT;
  v_base TEXT;
  v_count INT := 0;
  v_bs_id UUID;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'barbershop_name', 'Minha Barbearia');
  v_base := lower(regexp_replace(unaccent_lite(v_name), '[^a-z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  IF v_base = '' THEN v_base := 'barbearia'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.barbershops WHERE slug = v_slug) LOOP
    v_count := v_count + 1;
    v_slug := v_base || '-' || v_count;
  END LOOP;

  INSERT INTO public.barbershops(owner_id, name, slug, phone)
  VALUES (NEW.id, v_name, v_slug, NEW.raw_user_meta_data->>'phone')
  RETURNING id INTO v_bs_id;

  -- Default business hours: open Mon-Sat 09-19, closed Sunday
  INSERT INTO public.business_hours (barbershop_id, day_of_week, open_time, close_time, is_closed)
  SELECT v_bs_id, d, '09:00', '19:00', (d = 0)
  FROM generate_series(0,6) d;

  RETURN NEW;
END;
$$;

-- unaccent_lite fallback (no extension): just strip via translate
CREATE OR REPLACE FUNCTION public.unaccent_lite(t TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT translate(t,
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn');
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
