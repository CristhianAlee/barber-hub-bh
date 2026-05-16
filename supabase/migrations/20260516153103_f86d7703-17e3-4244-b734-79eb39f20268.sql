
REVOKE EXECUTE ON FUNCTION public.user_owns_barbershop(uuid) FROM anon;

-- Recreate owner policies scoped to authenticated only
DROP POLICY IF EXISTS "Owner manages services" ON public.services;
CREATE POLICY "Owner manages services" ON public.services
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages professionals" ON public.professionals;
CREATE POLICY "Owner manages professionals" ON public.professionals
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages appointments" ON public.appointments;
CREATE POLICY "Owner manages appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages clients" ON public.clients;
CREATE POLICY "Owner manages clients" ON public.clients
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages business hours" ON public.business_hours;
CREATE POLICY "Owner manages business hours" ON public.business_hours
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages professional business hours" ON public.professional_business_hours;
CREATE POLICY "Owner manages professional business hours" ON public.professional_business_hours
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages professional services" ON public.professional_services;
CREATE POLICY "Owner manages professional services" ON public.professional_services
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages products" ON public.products;
CREATE POLICY "Owner manages products" ON public.products
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages financial entries" ON public.financial_entries;
CREATE POLICY "Owner manages financial entries" ON public.financial_entries
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages sales" ON public.sales;
CREATE POLICY "Owner manages sales" ON public.sales
  FOR ALL TO authenticated
  USING (user_owns_barbershop(barbershop_id))
  WITH CHECK (user_owns_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Owner manages own barbershop" ON public.barbershops;
CREATE POLICY "Owner manages own barbershop" ON public.barbershops
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
