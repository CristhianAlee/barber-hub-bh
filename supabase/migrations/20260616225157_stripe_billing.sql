-- =============================================================
-- 20260616225157_stripe_billing.sql
-- Colunas de billing (Stripe) em barbershops + índices p/ webhook.
-- Aditiva e idempotente (IF NOT EXISTS). Não altera RLS nem dados.
-- Rodar no SQL Editor do Supabase antes de usar as Edge Functions.
-- =============================================================

ALTER TABLE barbershops
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
    DEFAULT 'trial'
    CHECK (subscription_status IN (
      'trial', 'active', 'past_due', 'canceled', 'incomplete'
    )),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
    DEFAULT NOW() + INTERVAL '7 days',
  ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMPTZ;

-- Lookup por customer_id no webhook.
CREATE INDEX IF NOT EXISTS idx_barbershops_stripe_customer
  ON barbershops (stripe_customer_id);

-- Lookup por subscription_id no webhook.
CREATE INDEX IF NOT EXISTS idx_barbershops_stripe_subscription
  ON barbershops (stripe_subscription_id);
