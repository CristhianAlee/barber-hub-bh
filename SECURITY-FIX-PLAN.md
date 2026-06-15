# SECURITY-FIX-PLAN — Correção de RLS anônimo (BarberHub)

> **STATUS: ✅ CONCLUÍDO** — Etapa 1 e Etapa 2 aplicadas no banco e validadas.
> Vazamento multi-tenant fechado; link público preservado.

Plano de correção das policies `anon` que vazavam dados entre contas.
Dividido em **2 etapas** para garantir que o link público de agendamento
nunca fique quebrado entre o banco e o deploy do frontend.

- **Etapa 1 (ADITIVA) — ✅ CONCLUÍDA** — `supabase/migrations/20260614211226_fix_anon_rls.sql`.
  Adiciona objetos novos (RPC + views) e endurece os INSERTs anônimos. Não quebra nada.
- **Etapa 2 (DROPs) — ✅ CONCLUÍDA** — `supabase/migrations/20260614221450_drop_anon_select_policies.sql`.
  Os 3 `DROP POLICY` finais, aplicados após a validação local da Etapa 1.

---

## Policies problemáticas (confirmadas via `pg_policies` no banco real)

| # | Policy | Problema |
|---|--------|----------|
| 1 | `appointments_public_read` — `FOR SELECT TO anon USING (true)` | Anônimo lê TODOS os agendamentos de TODAS as barbearias (`client_id`, `notes`, `status`, `barbershop_id`). |
| 2 | `appointments_anon_insert` — `WITH CHECK (true)` | Anônimo insere agendamento em qualquer `barbershop_id`, sem validação. |
| 3 | `barbershops_public_read` — `FOR SELECT TO anon USING (true)` | `select('owner_id')` retorna UUID de todos os donos; `select('*')` expõe a tabela inteira. |
| 4 | `professionals_public_read` — `FOR SELECT TO anon USING (active = true)` | Expõe `phone` (telefone pessoal) de todos os profissionais. |
| 5 | `clients_anon_insert` — `WITH CHECK (true)` | Anônimo cria cliente em qualquer `barbershop_id`. |

---

## Etapa 1 — ADITIVA (já na migration, segura)

### Correção 1 — `appointments`
- **RPC `get_booked_slots(p_barbershop_id, p_date)`** `SECURITY DEFINER`: retorna
  só `professional_id, time, duration_minutes` da barbearia+data. Não expõe
  `client_id`/`notes`/outras barbearias.
- **`appointments_anon_insert`** recriada: exige `barbershop_id` existente,
  `date >= CURRENT_DATE` e `status = 'pending'`.

> **Nota timezone:** `CURRENT_DATE` é UTC no Supabase. Agendamento para "hoje"
> feito à noite (BR) pode cair em `date < CURRENT_DATE`. Risco baixo. Se virar
> problema, usar `date >= (CURRENT_DATE - INTERVAL '1 day')`.

### Correção 2 — `barbershops`
- **View `public_barbershops`** (`security_invoker = false`) sem `owner_id`.

### Correção 3 — `professionals`
- **View `public_professionals`** (`security_invoker = false`) sem `phone`,
  já filtrando `active = true`.

### Correção 4 — `clients`
- **`clients_anon_insert`** recriada: exige `barbershop_id` existente.

### Mudanças de frontend (acompanham a Etapa 1)
- `src/routes/agendar.$slug.tsx`:
  - import de `supabasePublic`;
  - barbershops → `public_barbershops`;
  - professionals → `public_professionals`;
  - 3 leituras de `appointments` → `rpc('get_booked_slots', ...)` (check de
    conflito filtra em JS com `String(a.time).slice(0,5) === time`).
- `src/services/appointmentService.ts`: removidos os 3 métodos públicos mortos
  (`getPublicBarbershop`, `getPublicBusySlots`, `createPublicAppointment`).
- `src/types/database.ts`: regenerado (ou declarado manualmente) com as 2 views
  e a função `get_booked_slots`.

---

## VERIFICAÇÃO — tabelas mantidas como estão (sem view)

| Tabela | Coluna sensível? | Veredito |
|--------|------------------|----------|
| `business_hours` | Não (horário é público) | ✅ Manter `USING (true)` |
| `professional_business_hours` | Não (agenda) | ✅ Manter |
| `professional_services` | Não (apenas FKs) | ✅ Manter |
| `services` | `price` é preço de venda; sem coluna de custo/margem | ✅ Manter `USING (active = true)` |

Ressalva (baixa): com `USING (true)` um anônimo enumera catálogo/horários de
todas as barbearias mesmo sem o slug. É divulgação de catálogo público, não PII.
Blindar enumeração no futuro = views análogas. Não bloqueante.

---

## ✅ Etapa 2 — DROP POLICY finais (CONCLUÍDA)

Aplicada após validar o link público localmente. Registrada em
`supabase/migrations/20260614221450_drop_anon_select_policies.sql`.

```sql
DROP POLICY "appointments_public_read"  ON appointments;
DROP POLICY "barbershops_public_read"   ON barbershops;
DROP POLICY "professionals_public_read" ON professionals;
```

> **Catch:** depois desses DROPs, qualquer `.from("appointments").select(...)`
> no caminho anon retorna `[]` silenciosamente (RLS nega sem erro). Por isso as
> 3 leituras já foram migradas para a RPC na Etapa 1. Defesa em profundidade: o
> índice único `appointments_no_double_booking` ainda bloqueia double-booking no
> INSERT (erro `23505`, já tratado no frontend).

### Teste de validação pós-Etapa 2 (console do navegador, deslogado)
```js
await supabase.from('appointments').select('*')   // deve negar/voltar vazio
await supabase.from('barbershops').select('*')     // deve negar/voltar vazio
await supabase.from('professionals').select('phone') // deve negar/voltar vazio
```

---

## Ordem de aplicação

1. ✅ Etapa 1 — migration aditiva no banco.
2. ✅ Regenerar tipos TS (fallback manual — sem CLI logada).
3. ✅ Diffs de frontend + remover código morto.
4. ✅ `npm run build`.
5. ✅ Teste manual local do link público (com bug do `safeUuid` corrigido — ver abaixo).
6. ✅ **Etapa 2** — os 3 `DROP POLICY`.
7. ✅ Re-teste `select('*')` anônimo → negado.

---

## Validação (resultados)

Executada no console do navegador, **deslogado** (cliente criado só com a anon key).

**PARTE A — Etapa 1 não quebrou nada (antes dos DROPs):** ✅
- Link público `/agendar/<slug>` percorrido fim a fim: barbearia carrega,
  profissionais sem telefone, slots calculam, agendamento criado.
- `public_barbershops` retorna sem `owner_id`; `public_professionals` sem `phone`;
  `get_booked_slots` retorna só `professional_id/time/duration_minutes`.
- INSERT anônimo: `status='pending'` válido passa; `status='confirmed'`,
  `barbershop_id` inexistente e `date` no passado → bloqueados com `42501`.

**PARTE B — Etapa 2 fechou o vazamento (depois dos DROPs):** ✅
- **B1** — `appointments`, `barbershops`, `professionals` via `select('*')` anônimo:
  retornam **`data: [], error: null`** (RLS nega todas as linhas; `owner_id`/`phone`
  não saem mais por nenhum caminho direto). Vazamento multi-tenant **fechado**.
- **B2** — `public_barbershops`, `public_professionals` e `rpc('get_booked_slots')`
  **continuam funcionando** normalmente (views `security_invoker = false` + RPC
  `SECURITY DEFINER` ignoram o RLS das tabelas-base).
- **B3** — fluxo completo de agendamento **funciona** após os DROPs.

**Veredito:** isolamento por conta garantido para `anon`; link público preservado.

---

## Bug corrigido durante a validação — `safeUuid()`

No teste do fluxo, o insert de `clients` falhou com
`invalid input syntax for type uuid: '1781484316577-zkl7z8asm1k'`.

- **Causa:** o `client_id` usava `crypto.randomUUID()`, que exige *secure context*
  (HTTPS). Em `http://localhost`/LAN ele não existe e o código caía num fallback
  `${Date.now()}-${Math.random()...}`, gerando um valor **não-UUID** rejeitado pelo
  Postgres.
- **Correção:** helper `safeUuid()` em `agendar.$slug.tsx` que usa `crypto.randomUUID`
  quando disponível e, no fallback, `crypto.getRandomValues` (funciona em contexto
  não-seguro) para montar um **UUID v4 válido**. Não envolve RLS.
- **Por que não deixar o banco gerar o `id`:** exigiria ler o id de volta via
  `RETURNING`, que o `anon` não consegue sem policy de SELECT em `clients` — o que
  seria mexer em RLS, fora do escopo. Gerar UUID válido no cliente resolve sem isso.

## Policies de uso autenticado — NÃO afetadas

`appointments_owner_all`, `barbershops_owner_all`, `clients_owner_all`,
`professionals_owner_all`, `services_owner_all`, `business_hours_owner_all`, etc.
permanecem intactas. Só dropamos/recriamos policies `anon` (`*_public_read` e
`*_anon_insert`).
