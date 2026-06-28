# CONVENTIONS

Convenções observadas no código (não teóricas).

## Formatação / lint
- **Prettier** (`.prettierrc`): aspas duplas, ponto-e-vírgula, ~100 colunas.
- **ESLint** flat config (`eslint.config.js`): `react-hooks` ativo; `no-unused-vars` **desligado**. Lint via `npm run lint` (não bloqueia build).
- TypeScript: `@/` → `src/` (alias em tsconfig + `vite-tsconfig-paths`).

## Nomenclatura
- **Componentes**: PascalCase (`Checkout.tsx`, `AppSidebar`, `PaywallGuard`).
- **Rotas**: file-based do TanStack — `app.agendamentos.tsx`, `auth.login.tsx`, `agendar.$slug.tsx` (`$` = param dinâmico). URL derivada do nome.
- **Services/hooks/utils**: camelCase (`appointmentService`, `useFormValidation`, `getFriendlyErrorMessage`).
- shadcn/ui em `components/ui/` (kebab-case de arquivo, ex.: `dropdown-menu.tsx`).

## Padrão de dados
- **Services** retornam `ServiceResult<T> = { data: T | null; error: string | null }`. Cada service tem um helper `errMsg()` (a maioria ainda retorna `err.message` cru — ver CONCERNS).
- Rotas frequentemente chamam `supabase.from(...)` diretamente (sem passar por service) — padrão misto.
- **Dois clients**: `supabase` (autenticado) no painel; `supabasePublic` (anon) **só** no link público `/agendar/$slug`.

## Tratamento de erro (padrão)
```ts
console.error("[origem]", error);
toast.error(getFriendlyErrorMessage(error, "contexto da ação"));
```
- `src/lib/errorMessages.ts` mapeia códigos Postgres/Supabase (23505, 42501, ...) → PT-BR amigável; nunca expõe mensagem técnica na UI. `sonner` para toasts. `ErrorComponent` global no `__root` (sem stack trace ao usuário).

## Validação de formulários
- **Zod** (`src/lib/validationSchemas.ts`) + hook `useFormValidation` (`safeParse`, erros por campo). `maxLength` nos inputs como 2ª camada. **Não usa react-hook-form** — state manual.
- Público (`agendar`) e login: erro inline por campo. Painel: `safeParse` + toast do 1º erro.

## Estado / UI
- `useState`/`useEffect` (sem Redux/Zustand). TanStack Query disponível mas uso pontual.
- **i18n**: `useLanguage()` + `t("chave")`, dicionários `src/i18n/pt.ts` / `en.ts`.
- **Estilo**: Tailwind v4 + shadcn/ui; design system **dark + gold** (`bg-gradient-gold`, `text-gold`, `bg-background`, `text-destructive`, `text-success`, âmbar para no-show). Classe de tema `dark`/`light` no `<html>`.

## Git / projeto (de `CLAUDE.md`)
- Commits em PT/EN conforme contexto; **não** adicionar trailer `Co-Authored-By` (regra explícita do projeto, salvo `attribution.commit` em settings).
- Nunca commitar segredos/`.env`/`.mcp.json`. Preferir editar arquivos a criar novos. Validar input nas bordas. Manter arquivos < 500 linhas.
