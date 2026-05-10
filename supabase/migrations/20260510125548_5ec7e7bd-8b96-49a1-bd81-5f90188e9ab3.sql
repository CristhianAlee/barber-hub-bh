CREATE TABLE IF NOT EXISTS public.professional_business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  day_of_week smallint NOT NULL,
  open_time time without time zone NOT NULL DEFAULT '09:00:00',
  close_time time without time zone NOT NULL DEFAULT '19:00:00',
  is_closed boolean NOT NULL DEFAULT false,
  UNIQUE (professional_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  service_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (professional_id, service_id)
);

ALTER TABLE public.professional_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages professional business hours" ON public.professional_business_hours;
CREATE POLICY "Owner manages professional business hours"
ON public.professional_business_hours
FOR ALL
TO public
USING (public.user_owns_barbershop(barbershop_id))
WITH CHECK (public.user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Public reads professional business hours" ON public.professional_business_hours;
CREATE POLICY "Public reads professional business hours"
ON public.professional_business_hours
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Owner manages professional services" ON public.professional_services;
CREATE POLICY "Owner manages professional services"
ON public.professional_services
FOR ALL
TO public
USING (public.user_owns_barbershop(barbershop_id))
WITH CHECK (public.user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Public reads professional services" ON public.professional_services;
CREATE POLICY "Public reads professional services"
ON public.professional_services
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.professional_business_hours (barbershop_id, professional_id, day_of_week, open_time, close_time, is_closed)
SELECT p.barbershop_id, p.id, bh.day_of_week, bh.open_time, bh.close_time, bh.is_closed
FROM public.professionals p
JOIN public.business_hours bh ON bh.barbershop_id = p.barbershop_id
ON CONFLICT (professional_id, day_of_week) DO NOTHING;

INSERT INTO public.professional_services (barbershop_id, professional_id, service_id)
SELECT p.barbershop_id, p.id, s.id
FROM public.professionals p
JOIN public.services s ON s.barbershop_id = p.barbershop_id
ON CONFLICT (professional_id, service_id) DO NOTHING;