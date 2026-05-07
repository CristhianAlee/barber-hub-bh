
-- Fix search_path on unaccent_lite
CREATE OR REPLACE FUNCTION public.unaccent_lite(t TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE SET search_path = public AS $$
  SELECT translate(t,
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
    'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn');
$$;

-- Revoke execute on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_owns_barbershop(UUID) FROM PUBLIC, anon;
-- authenticated still needs it for RLS evaluation? RLS policies invoke as definer of policy expression — they don't require EXECUTE for the calling role since the function is called inside the policy by postgres internally. But to be safe, keep it for authenticated:
GRANT EXECUTE ON FUNCTION public.user_owns_barbershop(UUID) TO authenticated;

-- Tighten public client INSERT: must reference an existing barbershop
DROP POLICY "Public can insert client for booking" ON public.clients;
CREATE POLICY "Public can insert client for booking" ON public.clients
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id)
  );

-- Tighten public appointment INSERT: pending status + valid refs in same barbershop
DROP POLICY "Public can insert appointment" ON public.appointments;
CREATE POLICY "Public can insert appointment" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.barbershop_id = appointments.barbershop_id AND s.active = true)
    AND EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND p.barbershop_id = appointments.barbershop_id AND p.active = true)
    AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.barbershop_id = appointments.barbershop_id)
  );
