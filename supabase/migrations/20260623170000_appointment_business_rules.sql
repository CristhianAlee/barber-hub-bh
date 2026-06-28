-- =============================================================
-- 20260623170000_appointment_business_rules.sql
--
-- Validação server-side de regras de negócio em appointments, via
-- triggers (independe do frontend / forma de acesso à API).
--
-- AJUSTES vs. spec original (necessários — ver relatório):
--  * Coluna de intervalo é `booking_interval_minutes`, NÃO
--    `appointment_interval`. Como a variável não era usada na lógica de
--    conflito (que é por sobreposição de duração), removida.
--  * O trigger de schedule roda em INSERT OR UPDATE, MAS em UPDATE só
--    valida quando date/time/professional/duration mudam (reagendamento).
--    Updates só de status (confirmar/concluir/no_show/cancelar) NÃO são
--    revalidados — senão a feature de no-show e mudanças de status
--    quebrariam (ex.: concluir agendamento num dia que virou fechado).
--  * COALESCE em duration_minutes (default 30) para evitar NULL no cast.
--
-- NÃO altera RLS, policies, schema de colunas nem frontend.
-- =============================================================

-- ---------------------------------------------------------------------
-- REGRA 1 — dia/horário de funcionamento + conflito do profissional
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_appointment_schedule()
RETURNS TRIGGER AS $$
DECLARE
  biz_hours RECORD;
  appt_dow INTEGER;            -- 0 = domingo (EXTRACT DOW)
  appt_time TIME;
  conflict_count INTEGER;
BEGIN
  -- Em UPDATE, só validar agenda se houve REAGENDAMENTO (mudou
  -- data/hora/profissional/duração). Updates só de status passam direto.
  IF TG_OP = 'UPDATE'
     AND NEW.date = OLD.date
     AND NEW.time = OLD.time
     AND NEW.professional_id IS NOT DISTINCT FROM OLD.professional_id
     AND COALESCE(NEW.duration_minutes, 30) = COALESCE(OLD.duration_minutes, 30)
  THEN
    RETURN NEW;
  END IF;

  appt_dow  := EXTRACT(DOW FROM NEW.date::date);
  appt_time := NEW.time::time;

  -- Horário de funcionamento desse dia.
  SELECT * INTO biz_hours
  FROM business_hours
  WHERE barbershop_id = NEW.barbershop_id
    AND day_of_week = appt_dow;

  IF NOT FOUND OR biz_hours.is_closed THEN
    RAISE EXCEPTION 'A barbearia não funciona neste dia.';
  END IF;

  IF appt_time < biz_hours.open_time::time
     OR appt_time >= biz_hours.close_time::time THEN
    RAISE EXCEPTION 'Horário fora do funcionamento da barbearia (% às %).',
      biz_hours.open_time, biz_hours.close_time;
  END IF;

  -- Conflito de horário com outro agendamento do MESMO profissional no dia
  -- (sobreposição por duração). Ignora cancelados/no_show e o próprio row.
  SELECT COUNT(*) INTO conflict_count
  FROM appointments a
  WHERE a.barbershop_id = NEW.barbershop_id
    AND a.professional_id = NEW.professional_id
    AND a.date = NEW.date
    AND a.status NOT IN ('cancelled', 'no_show')
    AND a.id <> NEW.id
    AND (
      (NEW.time::time >= a.time::time
        AND NEW.time::time < (a.time::time + (COALESCE(a.duration_minutes, 30) || ' minutes')::interval))
      OR
      ((NEW.time::time + (COALESCE(NEW.duration_minutes, 30) || ' minutes')::interval) > a.time::time
        AND NEW.time::time < a.time::time)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Este horário conflita com outro agendamento do profissional.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_appointment_schedule_trigger ON appointments;
CREATE TRIGGER validate_appointment_schedule_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_schedule();

-- ---------------------------------------------------------------------
-- REGRA 2 — rate limit (anti-flood via API): 20 inserts/hora por barbearia
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_appointment_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM appointments
  WHERE barbershop_id = NEW.barbershop_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF recent_count >= 20 THEN
    RAISE EXCEPTION 'Limite de criação de agendamentos atingido. Tente novamente em 1 hora.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS appointment_rate_limit_trigger ON appointments;
CREATE TRIGGER appointment_rate_limit_trigger
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_rate_limit();
