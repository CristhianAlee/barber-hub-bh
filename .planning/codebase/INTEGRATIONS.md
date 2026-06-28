# External Integrations

**Analysis Date:** 2026-06-21

## APIs & External Services

**Backend-as-a-Service:**
- Supabase — auth, Postgres database, Row Level Security, Edge Functions, Storage. Sole backend.
  - SDK/Client: `@supabase/supabase-js` ^2.107.0 (frontend), `@supabase/supabase-js@2.45.0` via esm.sh (Edge Functions)
  - Frontend client setup: `src/lib/supabase.ts`
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Payments / Billing:**
- Stripe — subscription billing (Checkout, Billing Portal, Webhooks).
  - SDK: `stripe@14.21.0` via `esm.sh/...?target=deno` inside Edge Functions (`apiVersion: "2024-06-20"`)
  - Frontend never imports Stripe; it only invokes Edge Functions.

**Identity:**
- Google OAuth — social sign-in via Supabase Auth (`provider: "google"`).

**Messaging (deep links, not an API):**
- WhatsApp — `https://wa.me/55...` click-to-chat links (no SDK, no server).

**Fonts:**
- Google Fonts — `Bebas Neue`, `Inter`, `JetBrains Mono` via `<link>` in `index.html`.

## Supabase Integration Detail

**Two browser clients** (`src/lib/supabase.ts`):
- `supabase` — authenticated barber/owner client. `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, stored in `window.localStorage`.
- `supabasePublic` — used for the public booking link. `persistSession: false`, `autoRefreshToken: false` (no session).

Both use the **anon key** only. Database access is gated by **Row Level Security** (policies defined in `supabase/migrations/*.sql`, e.g. `fix_anon_rls.sql`, `drop_anon_select_policies.sql`, `fix_anon_insert_barbershop_exists.sql`). The public booking flow deliberately uses the anon client for client/appointment inserts and service/hours/professional reads (see recent commit "use anon client consistently in public booking flow").

**Service layer** wrapping Supabase calls lives in `src/services/`:
`appointmentService.ts`, `authService.ts`, `barbershopService.ts`, `clientService.ts`, `financialService.ts`, `productService.ts`, `professionalService.ts`, `serviceService.ts`, `storageService.ts`, `stripeService.ts`.

## Authentication & Identity

- Provider: Supabase Auth. Implementation in `src/services/authService.ts`.
  - Email/password: `signInWithPassword`, `signUp` (also inserts a `barbershops` row on signup).
  - Google OAuth: `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: \`${origin}/app\` } })`. Used from `src/routes/auth.login.tsx` and `src/routes/auth.signup.tsx`.
  - Password reset: `resetPasswordForEmail` → redirects to `/auth/reset`.
  - Sign out: clears `localStorage` and redirects to `/auth/login`.
- Google OAuth provider/credentials are configured in the Supabase dashboard (not in repo).
- Auth context: `src/lib/auth-context.tsx`.

## Stripe Billing Detail

**Edge Functions** (`supabase/functions/`):
- `create-checkout/index.ts` — creates a Stripe Checkout Session (`mode: "subscription"`). Validates caller JWT via anon client `auth.getUser()`, then uses service-role client to read/create the shop's Stripe customer. Grants a 7-day trial only if the shop never had a subscription. Success → `${FRONTEND_URL}/app?checkout=success`, cancel → `${FRONTEND_URL}/planos`.
- `create-portal/index.ts` — creates a Stripe Billing Portal Session for the shop's `stripe_customer_id`. Returns to `${FRONTEND_URL}/app/configuracoes`.
- `stripe-webhook/index.ts` — receives Stripe events; **verifies signature first** via `constructEventAsync` + `STRIPE_WEBHOOK_SECRET` (using `createSubtleCryptoProvider`). Must be deployed with `--no-verify-jwt` (Stripe does not send a Supabase JWT). Handles: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`. Maps Stripe status → `subscription_status` and updates the `barbershops` row via service-role client. Returns 500 to trigger Stripe retries on handler errors.
- `_shared/cors.ts` — shared CORS headers for checkout/portal.

**Frontend wiring** (`src/services/stripeService.ts`):
- `redirectToCheckout()` and `redirectToPortal()` call `supabase.functions.invoke("create-checkout" | "create-portal")` and redirect to the returned `url`. No secret keys touched client-side.
- `hasActiveAccess(barbershop)` — gates access by `subscription_status === "active"` or an unexpired trial.

**Paywall:** `src/components/shared/PaywallGuard.tsx`, applied in route `src/routes/app.tsx`. Pricing page: `src/routes/planos.tsx`.

**Billing schema:** `supabase/migrations/20260616225157_stripe_billing.sql` adds `barbershops` columns: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `trial_ends_at`, `current_period_ends_at`.

### Stripe Key Security Boundary

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` live **only** as Edge Function secrets (read via `Deno.env.get(...)`). They are never in the frontend or `VITE_*` vars.
- The frontend never holds a Stripe publishable key; it relies entirely on Edge-Function-generated redirect URLs.
- `SUPABASE_SERVICE_ROLE_KEY` is used **only inside Edge Functions** for privileged writes; never exposed to the browser.

## Data Storage

**Database:**
- Supabase Postgres. Schema/policies versioned in `supabase/migrations/*.sql`. Access via `@supabase/supabase-js` + RLS.

**File Storage:**
- Supabase Storage. Bucket `logos` (`src/services/storageService.ts`): uploads barbershop logos (max 2 MB; JPG/PNG/WebP), stores public URL on `barbershops.logo_url`, cache-busts with `?t=timestamp`.

**Caching:**
- None (server-side). TanStack Query provides client-side cache only.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry/etc.). Errors logged via `console.error` in services and Edge Functions.

**Logs:**
- Edge Functions log to Supabase function logs (`console.error("[function]", ...)`). Frontend logs to browser console.

## CI/CD & Deployment

**Hosting:**
- Frontend: Vercel (static SPA; `vercel.json` rewrites `/(.*)` → `/`).
- Backend: Supabase (managed DB, Auth, Edge Functions, Storage).

**CI Pipeline:**
- None detected in repo.

## Environment Configuration

**Frontend (`VITE_*`, exposed to client):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Validated at boot in `src/lib/supabase.ts` (throws if absent).

**Edge Function secrets (server-side only, set via Supabase):**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- `FRONTEND_URL`

**Secrets location:**
- Frontend `.env` (gitignored) at repo root; `.env.example` documents required keys (contents not read here — secret-sensitive).
- Edge Function secrets managed in the Supabase project, not in the repo.

## Webhooks & Callbacks

**Incoming:**
- Stripe → `stripe-webhook` Edge Function (signature-verified, `--no-verify-jwt`).

**Outgoing:**
- OAuth redirect callbacks to `${origin}/app` (Google sign-in) and `${origin}/auth/reset` (password reset).
- WhatsApp `wa.me` deep links opened from `src/routes/app.clientes.tsx` (client reminders) and `src/routes/agendar.$slug.tsx` (booking confirmation).

---

*Integration audit: 2026-06-21*
