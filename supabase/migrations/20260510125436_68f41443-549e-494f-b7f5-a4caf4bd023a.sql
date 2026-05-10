CREATE UNIQUE INDEX IF NOT EXISTS appointments_no_double_booking_active_idx
ON public.appointments (barbershop_id, professional_id, date, time)
WHERE status <> 'cancelled'::appointment_status;

DROP POLICY IF EXISTS "public_read_services" ON public.services;
CREATE POLICY "public_read_services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "public_read_professionals" ON public.professionals;
CREATE POLICY "public_read_professionals"
ON public.professionals
FOR SELECT
TO anon, authenticated
USING (active = true);

DROP POLICY IF EXISTS "public_read_barbershops" ON public.barbershops;
CREATE POLICY "public_read_barbershops"
ON public.barbershops
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public_read_business_hours" ON public.business_hours;
CREATE POLICY "public_read_business_hours"
ON public.business_hours
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public_read_appointments_slots" ON public.appointments;
CREATE POLICY "public_read_appointments_slots"
ON public.appointments
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public_insert_appointments" ON public.appointments;
CREATE POLICY "public_insert_appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'::appointment_status
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = appointments.service_id
      AND s.barbershop_id = appointments.barbershop_id
      AND s.active = true
  )
  AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = appointments.professional_id
      AND p.barbershop_id = appointments.barbershop_id
      AND p.active = true
  )
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = appointments.client_id
      AND c.barbershop_id = appointments.barbershop_id
  )
);