# CONCERNS

Débito técnico, riscos e issues conhecidos. Base largamente gerada por IA, com auditoria de segurança + migração SSR→SPA. Severidade: 🔴 alta · 🟠 média · 🟢 baixa.

## 🔴 Débito de tipos (`src/types/database.ts`)
- `npx tsc --noEmit` → **25 erros** (todos pré-existentes, runtime-safe). Causa: tipos Supabase **escritos à mão** com `RejectExcessProperties<Omit<...>>` marcando como obrigatórias colunas que têm default no banco.
- Call sites que falham: `appointmentService.ts:114`, `authService.ts:63`, `clientService.ts:70`, `financialService.ts:73,190,250,258`, `productService.ts:76,135,154`, `professionalService.ts:39`, `serviceService.ts:41`, e `auth.signup.tsx:75-76` (tipo já **atrasado em relação ao schema vivo** — `user_consents`/`user_id` não estão nos tipos → prova de drift repo↔DB).
- **Fix recomendado**: regenerar `database.ts` com `supabase gen types` (precisa CLI logada) e ajustar Insert/Update; depois ligar um gate `tsc`.

## 🔴 Build não faz typecheck
- `package.json` → `build: "vite build"` (sem `tsc`). Erros de tipo **não** quebram o build nem o deploy. O único gate real é o build de transpile.

## 🔴 RLS / link público frágil
- Corrigido, mas frágil: o link público **precisa** usar `supabasePublic` (anon) de forma consistente — bugs passados de 403 (insert via client autenticado) e 401 (policy `*_anon_insert` referenciando `barbershops`, resolvido com `SECURITY DEFINER barbershop_exists` em `20260618211828_*.sql`).
- Há **dois caminhos paralelos** de dados de cliente: `agendar.$slug.tsx` insere via `supabasePublic`, enquanto `clientService.ts` usa o client autenticado. Fácil regredir se um novo dev usar o client errado. Considerar centralizar/anotar.

## 🔴 Migrations aplicadas manualmente
- `supabase/migrations/` tem 5 arquivos aplicados **à mão** via SQL Editor (CLI Supabase não está linkada/autenticada neste ambiente). **Risco de drift** entre o repo e o banco real — já evidenciado pelos erros de `auth.signup.tsx` (código usa `user_consents` que não está nos tipos/migrations versionadas).
- `supabase/schema.sql` é "de referência", não a fonte de verdade aplicada.

## 🔴 Sem testes automatizados
- Nenhum runner/teste. QA 100% manual + `npm run build`. Ver `TESTING.md`.

## 🟠 Edge Functions sem CI
- `create-checkout`, `create-portal`, `stripe-webhook` deployadas **manualmente** (`supabase functions deploy ... --no-verify-jwt` para o webhook). Secret lido em `stripe-webhook/index.ts`. Sem pipeline → risco de versão deployada divergir do repo.

## 🟠 Bundle size
- `vite.config.ts` sem `manualChunks`. Build avisa chunks > 500 kB (vendores `recharts` + `@supabase/supabase-js`). Code-splitting só por rota (autoCodeSplitting do router). Otimizável.

## 🟠 Secrets (estado OK, vigiar)
- `.mcp.json` contém `STRIPE_SECRET_KEY` (sk_test) — **gitignored** (`.gitignore:51`, destrackeado no commit `bb81f6f`). `.env*` ignorados. **Nenhum segredo commitado** encontrado. Histórico antigo teve `.env` com apenas chaves públicas (anon/publishable) — sem service_role.
- Atenção: chaves coladas em chat durante a sessão devem ser rotacionadas.

## 🟢 Código morto / resíduos da migração SPA
- `checkoutService` foi removido limpo (PDV migrado para `Checkout.tsx`). Restam possíveis resíduos pré-SPA em `src/lib/` (`error-page.ts`, `error-capture.ts`, `local-data.ts`, `mock/data.ts`) — verificar se ainda têm referência.
- `npm audit` não rodado nesta sessão de mapeamento; rodar para checar vulnerabilidades de deps (build-time anteriores eram da cadeia esbuild/vite dev, dev-only).

## Resumo de prioridade
1. Quitar débito de tipos + ligar gate `tsc` (🔴).
2. Sincronizar migrations repo↔DB e versionar `user_consents` (🔴).
3. Centralizar o acesso anon do link público (🔴).
4. Adicionar testes (🔴) e CI para functions (🟠).
