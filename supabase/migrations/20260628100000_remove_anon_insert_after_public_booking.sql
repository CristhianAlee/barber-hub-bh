-- 20260628100000_remove_anon_insert_after_public_booking.sql
-- Remove o acesso direto anon de INSERT em clients/appointments.
-- O agendamento público passou a usar a Edge Function `public-booking`
-- (service_role), então as policies anon de INSERT não são mais necessárias.
--
-- ⚠️ APLICAR SOMENTE APÓS: (1) deploy da Edge Function `public-booking`,
-- (2) frontend agendar.$slug.tsx já chamando a função (já alterado),
-- (3) teste end-to-end do link público confirmando 'success'.
-- Aplicar antes disso quebra o agendamento público.
--
-- NÃO altera policies de SELECT anon (services/business_hours/prof_services
-- _public_read continuam), nem owner policies, nem RLS de leitura.

DROP POLICY IF EXISTS "appointments_anon_insert" ON appointments;
DROP POLICY IF EXISTS "clients_anon_insert" ON clients;

-- Verificação (rodar manualmente após aplicar):
-- SELECT policyname, cmd, roles FROM pg_policies
-- WHERE tablename IN ('appointments', 'clients') AND cmd = 'INSERT';
-- Esperado: apenas policies com roles = '{authenticated}'.
