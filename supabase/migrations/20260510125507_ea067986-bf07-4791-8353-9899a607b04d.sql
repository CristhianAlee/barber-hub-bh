REVOKE EXECUTE ON FUNCTION public.user_owns_barbershop(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.user_owns_barbershop(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_owns_barbershop(uuid) FROM public;