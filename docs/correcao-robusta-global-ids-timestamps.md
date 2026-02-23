# Correção Robusta Global — IDs e Timestamps no Prisma (Patients + Indicadores)

## 1) Contexto

Foram identificados erros recorrentes de validação Prisma no backend, por exemplo:

- `Argument id is missing` em `patients.create()`
- `Argument id is missing` em `childcare_indicators.create()`

Isso indica padrão estrutural no schema: múltiplos models com `id` obrigatório sem geração automática (`@default(uuid())`).

Além disso, existem campos `updatedAt` obrigatórios sem `@updatedAt`, o que aumenta risco de falhas em create/update.

---

## 2) Causa raiz

No `schema.prisma`, vários models foram definidos com:

```prisma
id String @id
```

Sem `@default(uuid())`, o Prisma exige que o código envie `id` manualmente em todo `create`.

Também há casos como:

```prisma
updatedAt DateTime
```

Sem `@updatedAt`, exigindo preenchimento manual em todos os fluxos.

---

## 3) Objetivo da correção robusta

1. Eliminar erros de `id` ausente em inserts.
2. Padronizar atualização de timestamp (`updatedAt`) de forma automática.
3. Reduzir fragilidade dos services e risco de regressão.
4. Garantir rollout seguro em Supabase/produção.

---

## 4) Estratégia técnica

### 4.1 Padronização de IDs

Para todos os models que ainda estão com `id String @id`, alterar para:

```prisma
id String @id @default(uuid())
```

### 4.2 Padronização de `updatedAt`

Para models com campo de atualização manual, alterar para:

```prisma
updatedAt DateTime @updatedAt
```

### 4.3 Fallback temporário no código

Até a migration estar 100% aplicada em todos os ambientes, manter fallback defensivo nos services críticos:

- `id: randomUUID()` em creates sensíveis
- `updatedAt: new Date()` quando necessário

Depois da migração validada, remover fallback gradualmente.

---

## 5) Escopo mínimo prioritário (imediato)

Aplicar primeiro nos fluxos que estão quebrando:

1. `patients`
2. `childcare_indicators`

Em seguida, revisar e corrigir os demais models com mesmo padrão para prevenir novos incidentes.

---

## 6) Plano de execução (sem downtime)

### Fase 1 — Compatibilidade

- Deploy do backend com fallback temporário (`randomUUID` + `new Date`).

### Fase 2 — Estrutura

- Ajustar `schema.prisma` (IDs + `updatedAt`).
- Gerar migration:

```bash
npx prisma migrate dev --name standardize_ids_and_updatedAt
```

- Revisar SQL gerado.

### Fase 3 — Produção

- Aplicar migration:

```bash
npx prisma migrate deploy
```

- Validar fluxo de cadastro e criação automática de indicadores.

### Fase 4 — Limpeza

- Remover fallback manual dos services, mantendo schema como fonte da regra.

---

## 7) Checklist de validação pós-correção

- [ ] `POST /patients` retorna `201` sem erro de `id`.
- [ ] Criação de `childcare_indicators` ocorre sem erro de `id`.
- [ ] `updatedAt` é preenchido automaticamente em create/update.
- [ ] Não há novos `PrismaClientValidationError` por campos obrigatórios técnicos.
- [ ] Fluxo completo (frontend → backend → banco) funciona para cadastro de paciente criança.

---

## 8) Riscos e mitigação

### Risco A: drift entre ambientes (local/staging/prod)

- **Mitigação:** validar `migrate status` antes de cada deploy.

### Risco B: migration aplicada após deploy de código

- **Mitigação:** manter fallback temporário no backend.

### Risco C: outros models com padrão inconsistente passarem despercebidos

- **Mitigação:** auditoria global no schema para `id @id` sem default e `updatedAt` sem `@updatedAt`.

---

## 9) Critérios de aceite

1. Nenhum erro `Argument id is missing` nos fluxos principais.
2. Cadastro de paciente e criação de indicadores funcionam em produção.
3. Schema padronizado e versionado por migration.
4. Processo de deploy documentado e reproduzível.
