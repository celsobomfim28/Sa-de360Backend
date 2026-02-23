# Guia de Correção — Erro `Unknown argument lastMenstrualDate` no `patients.create()`

## 1) Erro observado

No backend, durante `POST /v1/patients`, o Prisma retorna:

```txt
Unknown argument `lastMenstrualDate`
Invalid `prisma.patients.create()` invocation
```

Também aparece no payload interno de criação:

- `lastMenstrualDate`
- `deliveryDate`

Esses campos estão sendo enviados para `patients.create()`, mas **não pertencem ao model `patients`**.

---

## 2) Causa raiz

No `patient.service.ts`, o objeto `createData` está recebendo campos de `eligibilityCriteria` via spread amplo.

Com isso, campos de domínio de pré-natal (ex.: `lastMenstrualDate`) vazam para o create da tabela base de paciente.

---

## 3) Regra correta de domínio

### 3.1 Ficam em `patients`

- `isChild`
- `isPregnant`
- `isPostpartum`
- `hasHypertension`
- `hasDiabetes`
- `isElderly`
- `isWoman`
- `hypertensionDiagnosisDate`
- `diabetesDiagnosisDate`

### 3.2 Não ficam em `patients` (devem ir para `prenatal_data`)

- `lastMenstrualDate`
- `deliveryDate`

---

## 4) Correção recomendada (robusta)

1. Remover spread bruto de `eligibilityCriteria` em `createData`.
2. Montar `createData` com **whitelist explícita** de campos válidos de `patients`.
3. Manter criação de `prenatal_data` no fluxo de gestante usando `lastMenstrualDate`.
4. Continuar tratando opcionais com normalização (`''` → `undefined`).

---

## 5) Exemplo de abordagem (pseudo-código)

```ts
const createData = {
  // dados base do paciente
  cpf,
  cns,
  fullName,
  birthDate,
  sex,
  motherName,
  ...address,
  microAreaId,
  primaryPhone,
  secondaryPhone,
  email,

  // apenas flags/diagnósticos válidos em patients
  isChild,
  isPregnant,
  isPostpartum,
  hasHypertension,
  hasDiabetes,
  isElderly,
  isWoman,
  hypertensionDiagnosisDate,
  diabetesDiagnosisDate,
};

await prisma.patients.create({ data: createData });

if (isPregnant && lastMenstrualDate) {
  await prisma.prenatal_data.create({ ... });
}
```

---

## 6) Testes de validação pós-correção

### Cenário A — Paciente não gestante

- `isPregnant = false`
- Esperado: cria paciente sem tentar gravar `lastMenstrualDate` em `patients`.

### Cenário B — Paciente gestante com DUM

- `isPregnant = true`
- `lastMenstrualDate` preenchida
- Esperado: cria paciente + cria `prenatal_data`.

### Cenário C — Gestante sem DUM

- `isPregnant = true`
- `lastMenstrualDate` ausente
- Esperado: erro de validação claro (campos obrigatórios para gestante).

### Cenário D — Regressão

- Confirmar que não há mais erro `Unknown argument lastMenstrualDate`.

---

## 7) Complemento importante

Além desta correção, mantenha o plano de robustez estrutural já identificado:

- `id` com `@default(uuid())` nos models afetados
- `updatedAt` com `@updatedAt`

Isso evita novos erros de `Argument id is missing` em creates encadeados (paciente + indicadores).
