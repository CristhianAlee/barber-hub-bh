-- 20260623120000_input_sanitization.sql
-- Sanitização/validação server-side para tabelas acessíveis por anon
-- (clients e appointments). Defesa em profundidade: o React já escapa no
-- render, mas isto impede que payloads maliciosos sejam PERSISTIDOS.
-- NÃO altera RLS, schema de colunas, Checkout ou Stripe.

-- Função de sanitização básica de texto.
CREATE OR REPLACE FUNCTION sanitize_text(input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  -- Remove tags HTML (já neutraliza XSS)
  input := regexp_replace(input, '<[^>]*>', '', 'g');
  -- Limita tamanho
  input := left(input, 500);
  RETURN trim(input);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para clients (inserção anon via link público).
CREATE OR REPLACE FUNCTION sanitize_client_inputs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := sanitize_text(NEW.name);
  NEW.email := sanitize_text(NEW.email);
  NEW.notes := sanitize_text(NEW.notes);
  -- Validar telefone: só dígitos, 10-15 chars
  IF NEW.phone !~ '^\d{10,15}$' THEN
    RAISE EXCEPTION 'Telefone inválido: %', NEW.phone;
  END IF;
  -- Validar tamanho do nome
  IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_client_before_insert ON clients;
CREATE TRIGGER sanitize_client_before_insert
  BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION sanitize_client_inputs();

-- Trigger para appointments (inserção anon via link público).
CREATE OR REPLACE FUNCTION sanitize_appointment_inputs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.notes := sanitize_text(NEW.notes);
  -- Força pending SOMENTE para inserções anônimas (link público).
  -- Inserts autenticados (painel) mantêm o status enviado.
  IF current_setting('role') = 'anon' THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sanitize_appointment_before_insert ON appointments;
CREATE TRIGGER sanitize_appointment_before_insert
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION sanitize_appointment_inputs();
