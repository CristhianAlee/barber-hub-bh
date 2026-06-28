# TESTING

## Estado atual: **não há testes automatizados**
- Nenhum framework de teste instalado (sem vitest/jest/playwright/cypress nas deps).
- Nenhum arquivo `*.test.*` / `*.spec.*` no código (matches só em `node_modules`).
- `package.json` **não tem script `test`**.

## Como a qualidade é garantida hoje
1. **Smoke test manual no navegador** — o QA percorre os fluxos críticos (login, link público de agendamento, checkout/finalizar atendimento, no-show, billing Stripe) manualmente, inclusive em produção (Vercel). Vários bugs desta base foram pegos assim (403 no checkout, 401 no agendamento público).
2. **`npm run build` é o único gate automatizado** — mas é `vite build`, que **transpila sem typecheck**. Ou seja, erros de tipo **não** quebram o build.

## Gate de tipos (importante)
- `npx tsc --noEmit` reporta **~25 erros pré-existentes**, concentrados em `src/types/database.ts` (tipos Supabase escritos à mão; `RejectExcessProperties<Omit<...>>` marca como obrigatórias colunas que têm default no banco) e nos `insert` dos `src/services/*`. São **runtime-safe** (o banco preenche os defaults) mas mascaram erros reais. Detalhe em `CONCERNS.md`.
- `tsc` **não** faz parte do pipeline de build/deploy. Rodar `npx tsc --noEmit` manualmente é a forma de checar tipos.

## Scripts disponíveis (`package.json`)
| Script | Comando | Observação |
|---|---|---|
| `dev` | `vite dev` | servidor de desenvolvimento |
| `build` | `vite build` | produção SPA (dist/) — **sem typecheck** |
| `build:dev` | `vite build --mode development` | build de dev |
| `preview` | `vite preview` | serve o build |
| `lint` | `eslint .` | não bloqueia build |
| `format` | `prettier --write .` | |

## Recomendações (futuro)
- Adicionar **Vitest** + React Testing Library para os fluxos críticos (auth-context, validationSchemas, Checkout, hasActiveAccess).
- Adicionar um gate `tsc --noEmit` no CI **após** quitar o débito de tipos (`database.ts`), senão ele já entra vermelho.
- Testes E2E (Playwright) para o link público de agendamento e o checkout, que são os caminhos com histórico de regressão (RLS/role).
