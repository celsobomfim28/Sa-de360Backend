# Saúde 360 PSF - Backend

Backend API REST para o sistema Saúde 360 PSF, desenvolvido com Node.js, TypeScript, Express e Prisma.

## 🚀 Tecnologias

- **Node.js** 20.x LTS
- **TypeScript** 5.x
- **Express.js** 4.x
- **Prisma** 5.x (ORM)
- **PostgreSQL** 16
- **JWT** (Autenticação)
- **Zod** (Validação)
- **Winston** (Logging)
- **PDFKit** (Geração de PDFs)
- **Jest** (Testes)

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- PostgreSQL 16 ou superior
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório e entre na pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações locais.

4. Execute as migrations do banco de dados:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. (Opcional) Popule o banco com dados de teste:
```bash
npm run prisma:seed
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

### Produção
```bash
npm run build
npm start
```

## 📚 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento com hot reload
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Inicia o servidor em modo produção
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa migrations do banco
- `npm run prisma:studio` - Abre o Prisma Studio (GUI do banco)
- `npm run prisma:seed` - Popula o banco com dados iniciais
- `npm run prisma:seed-vaccines` - Popula catálogo de vacinas do PNI
- `npm run prisma:triggers` - Aplica triggers PostgreSQL
- `npm run lint` - Executa o ESLint
- `npm run format` - Formata o código com Prettier
- `npm test` - Executa testes unitários

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas, inclua o token no header:

```
Authorization: Bearer {seu-token-jwt}
```

## 📖 Documentação da API

A documentação completa da API está disponível em:
- [docs/api.md](../docs/api.md)

### Endpoints Principais

#### Autenticação
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Renovar token
- `POST /v1/auth/logout` - Logout

#### Pacientes
- `POST /v1/patients` - Cadastrar paciente
- `GET /v1/patients` - Listar pacientes
- `GET /v1/patients/:id` - Buscar paciente
- `PUT /v1/patients/:id` - Atualizar paciente
- `DELETE /v1/patients/:id` - Inativar paciente
- `GET /v1/patients/:id/timeline` - Histórico do paciente
- `GET /v1/patients/:id/indicators` - Indicadores do paciente

#### Vacinas
- `GET /v1/vaccines` - Listar catálogo de vacinas
- `GET /v1/vaccines/schedule/:patientId` - Calendário vacinal
- `POST /v1/vaccines/apply` - Registrar aplicação
- `GET /v1/vaccines/pending/:patientId` - Vacinas pendentes
- `GET /v1/vaccines/card/:patientId` - Cartão de vacinação

#### Exames Laboratoriais
- `POST /v1/lab-exams/requests` - Criar solicitação
- `GET /v1/lab-exams/requests` - Listar solicitações
- `POST /v1/lab-exams/:examId/collection` - Registrar coleta
- `POST /v1/lab-exams/:examId/result` - Registrar resultado
- `POST /v1/lab-exams/:examId/evaluate` - Avaliar exame
- `GET /v1/lab-exams/patients/:patientId/history` - Histórico

#### Relatórios PDF
- `GET /v1/reports/patient/:patientId` - Prontuário
- `GET /v1/reports/vaccination-card/:patientId` - Cartão de vacinação
- `POST /v1/reports/indicators` - Relatório de indicadores
- `POST /v1/reports/production` - Relatório de produção

#### Notificações
- `GET /v1/notifications` - Listar notificações
- `PUT /v1/notifications/:id/read` - Marcar como lida
- `POST /v1/notifications/automatic` - Enviar automáticas

#### Dashboard
- `POST /v1/dashboard/stats-by-period` - Estatísticas por período
- `POST /v1/dashboard/indicator-evolution` - Evolução de indicadores
- `POST /v1/dashboard/compare-periods` - Comparar períodos

## 🗄️ Estrutura do Banco de Dados

O schema do banco está definido em `prisma/schema.prisma`. Principais entidades:

- **User** - Usuários do sistema (ACS, Enfermeiro, Médico, etc.)
- **Patient** - Pacientes cadastrados
- **MicroArea** - Microáreas territoriais
- **Appointment** - Consultas agendadas
- **HomeVisit** - Visitas domiciliares
- **PrenatalData** - Dados de pré-natal
- **ChildcareConsultation** - Consultas de puericultura
- **DiabetesConsultation** - Consultas de diabetes
- **HypertensionConsultation** - Consultas de hipertensão
- **ElderlyConsultation** - Consultas de idoso
- **WomanExam** - Exames de saúde da mulher
- **WomanHealthConsultation** - Consultas de saúde sexual
- **Vaccine** - Catálogo de vacinas
- **VaccineRecord** - Registro de vacinas aplicadas
- **LabExamRequest** - Solicitações de exames
- **LabExam** - Exames laboratoriais
- **AnthropometryRecord** - Registros de peso/altura
- **BloodPressureRecord** - Registros de pressão arterial
- **AuditLog** - Logs de auditoria

## 🔒 Segurança

- Senhas criptografadas com bcrypt (12 salt rounds)
- Rate limiting (100 req/min por IP)
- Helmet.js para headers de segurança
- CORS configurado
- Validação de inputs com Zod
- Auditoria de todas as operações

## 📊 Logging

Logs são salvos em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

Níveis de log: error, warn, info, http, debug

## 🧪 Testes

```bash
npm test
```

## 📝 Licença

MIT

## 👥 Equipe

Saúde 360 Team

---

Para mais informações, consulte a [documentação completa](../docs/).
