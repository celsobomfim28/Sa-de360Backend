# Plano de Correção — Backend (Cadastro de Paciente 400 Bad Request)

## 1) Contexto do problema

Durante o cadastro de paciente (`POST /v1/patients`), o frontend envia payload aparentemente válido, mas o backend retorna **400 Bad Request** em produção.

Pelos artefatos do projeto:

- A validação de entrada é feita por **Zod** (`backend/src/validators/patient.validator.ts`)
- A criação é feita via **Prisma** (`backend/src/services/patient.service.ts`)
- O tratamento de erro converte falhas do Prisma para `400` em alguns cenários (`backend/src/middlewares/errorHandler.ts`)

> Observação: erro de validação Zod tende a retornar `422`. Como o caso reportado foi `400`, há forte indício de erro de persistência/contrato com banco (FK, schema, campos opcionais, etc.).

---

## 2) Causas prováveis (priorizadas)

1. **Violação de FK em `microAreaId` (P2003)**
   - `microAreaId` recebido não existe no banco do ambiente de produção.
2. **Strings vazias chegando ao Prisma em campos opcionais de data/texto**
   - Ex.: `''` para campos de data opcionais, causando comportamento inesperado em criação/transformação.
3. **Divergência de schema/migration entre ambientes**
   - Produção com schema diferente do esperado pelo serviço.

---

## 3) Objetivos da correção

- Tornar o backend **resiliente** a campos opcionais vazios.
- Retornar erros **mais explícitos** (especialmente FK/validação de persistência).
- Facilitar diagnóstico em produção sem expor stack sensível.

---

## 4) Plano técnico (backend)

### 4.1 Normalização defensiva no service

Arquivo alvo: `backend/src/services/patient.service.ts`

Ações:

- Introduzir normalização para converter `''` em `undefined` para campos opcionais.
- Aplicar especificamente em:
  - `cns`, `motherName`, `primaryPhone`, `secondaryPhone`, `email`
  - `address.complement`, `address.zipCode`, `address.referencePoint`
  - `eligibilityCriteria.lastMenstrualDate`, `deliveryDate`, `hypertensionDiagnosisDate`, `diabetesDiagnosisDate`
- Sanitizar campos numéricos textuais (CPF/CNS/CEP/telefones) removendo máscara quando aplicável.

Resultado esperado:

- Menos erros de persistência por formato inadequado de opcionais.

---

### 4.2 Validação explícita de `microAreaId` antes do create

Arquivo alvo: `backend/src/services/patient.service.ts`

Ações:

- Antes de `prisma.patients.create`, validar existência da microárea:
  - `prisma.micro_areas.findUnique({ where: { id: microAreaId } })`
- Se não existir, lançar `AppError(400, 'Microárea inválida', 'INVALID_MICROAREA')`.

Resultado esperado:

- Erro previsível e compreensível (em vez de FK genérica no Prisma).

---

### 4.3 Melhorar mapeamento de erros do Prisma

Arquivo alvo: `backend/src/middlewares/errorHandler.ts`

Ações:

- Manter tratamento de `P2003`, mas enriquecer `details` com contexto seguro.
- Padronizar mensagem para facilitar leitura no frontend:
  - `code: 'FOREIGN_KEY_VIOLATION'`
  - `message: 'Referência inválida para relacionamento obrigatório'`
  - `details.field` quando disponível.

Resultado esperado:

- Diagnóstico mais rápido no cliente e nos logs.

---

### 4.4 Verificação de consistência de migrations em produção

Checklist operacional:

- Executar `prisma migrate status` no ambiente de deploy.
- Garantir que o schema em produção esteja alinhado ao `schema.prisma` versionado.
- Confirmar presença e integridade das `micro_areas` usadas no cadastro.

Resultado esperado:

- Redução de erro por drift de ambiente.

---

## 5) Critérios de aceite (backend)

1. `POST /patients` com `microAreaId` válido retorna `201`.
2. `POST /patients` com `microAreaId` inválido retorna `400` com `code = INVALID_MICROAREA` (ou erro de FK padronizado).
3. Campos opcionais vazios não derrubam criação.
4. Logs e resposta de erro permitem identificar rapidamente campo/causa.

---

## 6) Roteiro de testes rápidos

### Cenário A — Sucesso mínimo

- Enviar payload com obrigatórios + `microAreaId` válido.
- Esperado: `201` e paciente criado.

### Cenário B — Microárea inválida

- Enviar `microAreaId` inexistente.
- Esperado: `400` com código semântico de referência inválida.

### Cenário C — Opcionais vazios

- Enviar opcionais como `''`.
- Esperado: criação concluída sem erro de validação/persistência.

### Cenário D — Regra gestante

- `isPregnant = true` sem `lastMenstrualDate`.
- Esperado: erro de validação claro apontando `eligibilityCriteria.lastMenstrualDate`.

---

## 7) Riscos e mitigação

- **Risco:** quebrar fluxo de criação existente por mudança de normalização.
  - **Mitigação:** testar payloads antigos e novos; manter compatibilidade retroativa.
- **Risco:** ambiguidade de mensagens de erro para time de suporte.
  - **Mitigação:** manter `code` estável e documentado.

---

## 8) Entrega incremental sugerida

1. PR 1: normalização defensiva + validação de microárea.
2. PR 2: melhorias de error handler + padronização de respostas.
3. PR 3: validação operacional de migrations/seed em produção.
