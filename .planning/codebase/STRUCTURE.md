# STRUCTURE

## Raiz
```
index.html              Entry SPA (#root, anti-FOUC, fontes, meta/og)
vite.config.ts          Vite: TanStackRouterVite + react + tailwindcss + tsConfigPaths
vercel.json             Rewrite SPA: /(.*) → /  (deploy estático Vercel)
package.json            Scripts: dev, build (vite build, sem tsc), build:dev, preview, lint, format
.prettierrc             Aspas duplas, ponto-e-vírgula, ~100 colunas
eslint.config.js        ESLint flat config (react-hooks on, no-unused-vars off)
tsconfig*.json          TS config (paths @/* → src/*)
.gitignore              Ignora .env*, .mcp.json, artefatos de shell
.mcp.json               MCP local (claude-flow + stripe sk_test) — GITIGNORED
CLAUDE.md               Regras do projeto (inclui política Co-Authored-By)
supabase/schema.sql     Schema completo + RLS de referência
```

## src/
```
main.tsx                Bootstrap: createRoot → QueryClientProvider → RouterProvider
router.tsx              getRouter() — createRouter(routeTree, context.queryClient)
routeTree.gen.ts        GERADO pelo router-plugin (não editar à mão)
styles.css              Tailwind v4 (@import) + design system dark/gold + tw-animate-css

routes/                 Rotas file-based (TanStack Router)
  __root.tsx            Root: providers (Theme>Language>Auth) + Toaster + CookieBanner + error/404
  index.tsx             /              Landing page
  planos.tsx            /planos        Página de planos (público, CTA checkout)
  termos.tsx            /termos        Termos de uso
  privacidade.tsx       /privacidade   Política de privacidade
  agendar.$slug.tsx     /agendar/$slug Link público de agendamento (usa supabasePublic)
  auth.tsx              /auth          Layout auth (guard: logado → /app)
  auth.login.tsx        /auth/login
  auth.signup.tsx       /auth/signup
  auth.recover.tsx      /auth/recover
  auth.reset.tsx        /auth/reset
  auth.verify.tsx       /auth/verify
  app.tsx               /app           Layout protegido (guard: sem sessão → login) + PaywallGuard + sidebar
  app.index.tsx         /app/          Dashboard (métricas, gráfico, pendências, link público)
  app.onboarding.tsx    /app/onboarding
  app.agendamentos.tsx  /app/agendamentos  Agenda + ciclo (confirmar/concluir/faltou/cancelar/reagendar)
  app.clientes.tsx      /app/clientes
  app.estoque.tsx       /app/estoque
  app.financeiro.tsx    /app/financeiro
  app.configuracoes.tsx /app/configuracoes (barbearia, horários, profissionais, serviços, Minha Conta)

components/
  Checkout.tsx          Finalização do atendimento (venda + financeiro + estoque + completed)
  Logo.tsx
  ui/                   shadcn/ui (~50 componentes: button, dialog, input, card, select, ...)
  layout/AppSidebar.tsx
  shared/               CookieBanner, ThemeToggle, PaywallGuard

services/               Camada de dados (ServiceResult{data,error})
  authService, barbershopService, clientService, serviceService, professionalService,
  productService, financialService, appointmentService, storageService, stripeService

lib/
  supabase.ts           Clients `supabase` (auth) e `supabasePublic` (anon)
  auth-context.tsx      AuthProvider + useAuth (sessão + barbershop + billing)
  errorMessages.ts      getFriendlyErrorMessage (tradução de erros técnicos)
  validationSchemas.ts  Schemas Zod (booking, login, signup, cliente, serviço, ...)
  format.ts             brl, formatPhone, onlyDigits, formatDateBR, safeUuid, etc.
  utils.ts              cn() (tailwind merge)
  local-data.ts, error-capture.ts, error-page.ts (resíduos pré-SPA — alguns mortos)

hooks/                  useFormValidation, useLanguage, useTheme, use-mobile
i18n/                   pt.ts, en.ts
types/                  database.ts (tipos Supabase ESCRITOS À MÃO — fonte de débito de tipos)
mock/                   data.ts (mock legado)
assets/                 barberhub-logo.png
```

## supabase/
```
schema.sql              DDL + RLS de referência (não é a fonte de verdade aplicada)
migrations/             Migrations versionadas (aplicadas MANUALMENTE via SQL Editor)
  ..._fix_anon_rls.sql                       RPC get_booked_slots + views public_* + anon insert
  ..._drop_anon_select_policies.sql          Remove *_public_read (hardening)
  ..._stripe_billing.sql                     Colunas billing em barbershops
  ..._fix_anon_insert_barbershop_exists.sql  Função barbershop_exists (corrige 403 anon)
  ..._add_no_show_status.sql                 status no_show + clients.no_show_count
functions/              Edge Functions (Deno) — deploy manual
  _shared/cors.ts
  create-checkout/index.ts
  create-portal/index.ts
  stripe-webhook/index.ts   (deploy com --no-verify-jwt)
```
