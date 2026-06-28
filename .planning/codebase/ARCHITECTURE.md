# ARCHITECTURE

BarberHub — SaaS de gestão para barbearias. **React + Vite SPA** (client-only), TypeScript, Supabase (Postgres + Auth + RLS + Edge Functions + Storage), TanStack Router (file-based), Stripe (assinatura). Migrado recentemente de **TanStack Start (SSR) → Vite SPA puro** para deploy estático na Vercel.

## Entry / bootstrap (SPA)
```
index.html (raiz)                → <div id="root"> + anti-FOUC theme script + Google Fonts
  └─ src/main.tsx                → createRoot → <StrictMode>
       └─ QueryClientProvider    → client = router.options.context.queryClient (um único QueryClient)
            └─ RouterProvider    → router = getRouter()  (src/router.tsx)
```
- `src/router.tsx` → `getRouter()` cria `createRouter({ routeTree, context: { queryClient }, scrollRestoration })` usando **`@tanstack/react-router`** (não react-start).
- `src/routeTree.gen.ts` → **gerado automaticamente** pelo plugin `TanStackRouterVite` (autoCodeSplitting) a partir de `src/routes/*`.
- Não há `main.tsx`/`index.html` no estilo SSR; todo SSR (`server.ts`, `start.ts`, shell `<html>`) foi removido na migração.

## Provider stack (`src/routes/__root.tsx`)
`createRootRouteWithContext<{ queryClient }>()`; `RootComponent` envolve a app:
```
<ThemeProvider>          (src/hooks/useTheme.tsx — classe dark/light, STORAGE_KEY "barberhub.theme")
  <LanguageProvider>     (src/hooks/useLanguage — i18n pt/en)
    <AuthProvider>       (src/lib/auth-context.tsx — sessão Supabase)
      <Outlet/>
      <Toaster richColors position="top-right"/>   (sonner)
      <CookieBanner/>
```
Também define `errorComponent` (tela genérica "Algo deu errado" + recarregar) e `notFoundComponent` (404). Sem `HeadContent`/`Scripts`/`shellComponent` (eram SSR).

## Autenticação (100% client-side, Supabase Auth)
- **`src/lib/auth-context.tsx`** — `AuthProvider` + hook `useAuth()`. No mount: `supabase.auth.getSession()` + assina `onAuthStateChange`. Para um usuário logado, busca a barbearia do dono (`barbershops.owner_id = user.id`) incluindo colunas de billing (`subscription_status`, `trial_ends_at`, `current_period_ends_at`, `stripe_*`). Expõe: `user, session, barbershop, loading, refreshBarbershop, signOut`.
- **Guards de rota (`beforeLoad`)** — TanStack Router, funcionam em SPA:
  - `src/routes/app.tsx` → se sem sessão, `redirect('/auth/login')` (guard client-only via `typeof window`). `AppLayout` força `/app/onboarding` se a barbearia não fez onboarding.
  - `src/routes/auth.tsx` → se já há sessão, `redirect('/app')`.
- **`PaywallGuard`** (`src/components/shared/PaywallGuard.tsx`) — envolve o `<Outlet/>` de `/app`. Libera se `hasActiveAccess` (assinatura `active` ou trial não expirado); senão renderiza tela de bloqueio (trial expirado / past_due / canceled) com CTA para checkout/portal.

## Camada de dados (dois clients Supabase)
`src/lib/supabase.ts` exporta **dois clients** com a mesma URL + anon key:
- **`supabase`** — autenticado (`persistSession: true`, autoRefresh, detectSessionInUrl). Usado em todo o painel `/app/*` (role `authenticated`).
- **`supabasePublic`** — anônimo (`persistSession: false`). Usado **exclusivamente** no link público `/agendar/$slug` para garantir role `anon` mesmo se houver sessão de barbeiro no navegador.
- **Services** (`src/services/*.ts`) encapsulam queries e retornam `ServiceResult<T> = { data, error }`; erros traduzidos por `getFriendlyErrorMessage` (`src/lib/errorMessages.ts`).
- **Checkout interno** (`src/components/Checkout.tsx`) deriva o `barbershop_id` de `useAuth().barbershop.id` (fonte autoritativa), não da prop do agendamento.

## RLS / acesso público (multi-tenant)
- Policies de dono usam a função `get_user_barbershop_id()` (SECURITY DEFINER) → isolamento por barbearia.
- Acesso anônimo (link de agendamento) **não** lê tabelas-base diretamente; usa:
  - **Views** `public_barbershops` (sem `owner_id`) e `public_professionals` (sem `phone`) — `security_invoker = false`.
  - **RPC** `get_booked_slots(barbershop_id, date)` (SECURITY DEFINER) — horários ocupados sem expor `client_id`/`notes`.
  - **Função** `barbershop_exists(uuid)` (SECURITY DEFINER) — usada no `WITH CHECK` dos inserts anônimos (`clients`/`appointments`) para validar a barbearia sem precisar de SELECT em `barbershops` (que o anon perdeu após o hardening).
- Definições em `supabase/migrations/*` e `supabase/schema.sql`.

## Billing Stripe
- **Edge Functions** (`supabase/functions/`): `create-checkout` e `create-portal` (validam JWT do usuário, usam service-role p/ ler/gravar `barbershops`), `stripe-webhook` (deploy `--no-verify-jwt`; valida assinatura `constructEventAsync`; service-role atualiza `subscription_status`, `stripe_subscription_id`, `current_period_ends_at`).
- **Frontend** `src/services/stripeService.ts` → `supabase.functions.invoke(...)` (`redirectToCheckout`, `redirectToPortal`, `hasActiveAccess`). `STRIPE_SECRET_KEY` nunca no frontend.
- UI: `planos.tsx` (público), `SubscriptionCard` em `app.configuracoes.tsx`, detecção `?checkout=success` no dashboard.

## Ciclo de vida do agendamento
```
pending ──Confirmar──► confirmed ──Concluir──► [Checkout] ──► completed
   │                       │        (sales + sale_items + financial_entries(income)
   │                       │         + stock_movements + clients.total_visits/total_spent/last_visit)
   ├──Faltou──► no_show (clients.no_show_count++ ; NÃO mexe no financeiro)
   └──Cancelar──► cancelled
   (Reagendar: nova data/hora, volta a confirmed)
```
Pendências passadas (`status IN (pending,confirmed) AND date < hoje`): alerta no Dashboard + toggle "Pendências (N)" em Agendamentos.

## Fluxo de dados — link público (`/agendar/$slug`)
1. `supabasePublic` lê `public_barbershops` por `slug`; depois `public_professionals` + `services`/`business_hours`/`professional_business_hours`/`professional_services` (anon).
2. Slots calculados a partir da RPC `get_booked_slots` (anon).
3. Submit: `insert` em `clients` (id UUID gerado no client via `safeUuid`) + `insert` em `appointments` (`status='pending'`), ambos como `anon` → validados pelas policies `*_anon_insert` (`barbershop_exists` + regras).
4. Confirmação via toast + abre WhatsApp (`wa.me`).
