# Correção Robusta — Erro `Argument id is missing` no cadastro de pacientes

## 1) Diagnóstico confirmado

Erro observado no backend:

```txt
Invalid `prisma.patients.create()` invocation
...
Argument `id` is missing.
```

No `schema.prisma` atual, em `model patients`:

- `id String @id` (obrigatório e sem default)
- `updatedAt DateTime` (obrigatório e sem `@updatedAt`)

No `patient.service.ts`, o `createData` não envia `id` e pode não enviar `updatedAt` de forma consistente.

Resultado: falha em runtime com `PrismaClientValidationError` e resposta `400 VALIDATION_ERROR`.

---

## 2) Objetivo da correção robusta

1. Tornar `patients` consistente com padrão Prisma para criação automática.
2. Eliminar dependência de geração manual de `id`/`updatedAt` em cada fluxo.
3. Garantir deploy seguro com rollback previsível.

---

## 3) Ajustes recomendados no schema Prisma

### 3.1 Model `patients`

Alterar para:

```prisma
model patients {
  id        String   @id @default(uuid())
  ...
  updatedAt DateTime @updatedAt
  ...
}
```

### 3.2 Benefícios

- `id` passa a ser gerado automaticamente no banco/Prisma.
- `updatedAt` passa a ser atualizado automaticamente em inserts/updates.
- Reduz erro humano e código defensivo repetitivo em services.

---

## 4) Ajustes recomendados no service (fallback temporário)

Enquanto a migration não estiver aplicada em todos os ambientes, manter fallback no create:

- `id: randomUUID()`
- `updatedAt: new Date()`

> Após todos os ambientes estarem com migration aplicada e validação concluída, este fallback pode ser removido.

---

## 5) Plano de migration (passo a passo)

1. Alterar `backend/prisma/schema.prisma` no model `patients`.
2. Gerar migration local:

```bash
npx prisma migrate dev --name fix_patients_id_default_and_updatedAt
```

3. Validar SQL gerado na migration.
4. Executar testes de criação/edição de paciente em ambiente local.
5. Aplicar em staging.
6. Aplicar em produção:

```bash
npx prisma migrate deploy
```

---

## 6) Estratégia de deploy sem downtime

1. **Fase 1 (compatibilidade):**
   - Deploy backend com fallback (`id` + `updatedAt` no service).
2. **Fase 2 (estrutura):**
   - Aplicar migration (`@default(uuid())` + `@updatedAt`).
3. **Fase 3 (limpeza):**
   - Remover fallback manual do service (opcional).

Essa abordagem evita quebra caso exista delay entre deploy de código e deploy de migration.

---

## 7) Checklist de validação pós-release

- [ ] `POST /patients` cria paciente com sucesso (201).
- [ ] Não há erro `Argument id is missing` nos logs.
- [ ] `updatedAt` é preenchido na criação.
- [ ] `updatedAt` muda em `PUT /patients/:id`.
- [ ] Fluxo de cadastro no frontend (3 passos) conclui sem erro 400.
- [ ] Logs de erro preservam rastreabilidade sem expor dados sensíveis.

---

## 8) Critérios de aceite

1. Erro de validação Prisma para `id` ausente não ocorre mais.
2. Criação e atualização de pacientes funcionam em todos os ambientes.
3. Schema Prisma e banco estão alinhados por migration versionada.
4. Processo de deploy documentado e reproduzível.

---

## 9) Observações adicionais

- O payload atual do frontend está compatível para os campos principais; o bloqueio principal foi estrutural do backend/schema.
- Recomenda-se também revisar outros models com `id @id` sem default e `updatedAt` sem `@updatedAt` para prevenir incidentes semelhantes.
