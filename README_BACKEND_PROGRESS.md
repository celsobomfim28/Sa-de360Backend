# Backend Progress - Saúde 360 PSF

## Implementação Realizada

O backend foi desenvolvido seguindo a arquitetura definida no `SYSTEM_CONTEXT.md`. Os principais módulos foram implementados utilizando **Node.js, Express, Prisma (PostgreSQL) e TypeScript**.

### Módulos Implementados

1.  **Gestão de Pacientes (Base)** `src/modules/patient`
    *   CRUD completo de pacientes.
    *   Cálculo automático de elegibilidade (Criança, Gestante, Hipertenso, etc.).
    *   **Timeline Completa (`getTimeline`)**: Agrega consultas, visitas, vacinas e exames em uma linha do tempo unificada.
    *   **Resumo de Indicadores (`getIndicators`)**: Calcula o status (Verde/Amarelo/Vermelho) de todos os indicadores do paciente.

2.  **Módulo A: Mais Acesso à APS** `src/modules/appointment`
    *   Agendamento de consultas.
    *   Agenda do dia para o ACS (funcionalidade offline-ready).
    *   Registro de faltas e busca ativa de faltosos.
    *   Registro de aviso de consulta pelo ACS.

3.  **Visitas Domiciliares (Transversal)** `src/modules/homeVisit`
    *   Registro de visitas com geolocalização.
    *   Integração automática com indicadores (atualiza datas de VD1, VD2, etc. nos módulos específicos).
    *   **Visitas Pendentes**: Endpoint que lista para o ACS quais crianças e gestantes precisam de visita na microárea.

4.  **Módulo C: Cuidado na Gestação e Puerpério** `src/modules/prenatal`
    *   Início de pré-natal (criação de `PrenatalData`).
    *   Registro de consultas com atualização automática dos indicadores C1 (Consultas), C2 (PA), C3 (Peso).
    *   Consultas de puerpério e encerramento do ciclo.
    *   Controle de Exames (Indicador C6) por trimestre.

5.  **Módulo B: Desenvolvimento Infantil** `src/modules/childcare`
    *   Consultas de puericultura (crescimento e desenvolvimento).
    *   Gráficos de crescimento (atualização de indicadores B3).
    *   Registro de vacinas (Indicador B5).
    *   Monitoramento da primeira consulta (B1) e total de consultas (B2).

6.  **Módulo D: Cuidado da Pessoa com Diabetes** `src/modules/diabetes`
    *   Cálculo automático dos indicadores D1 a D6 (Consulta, PA, Antropometria, Visitas, HbA1c, Pé Diabético).
    *   Endpoint para registro de avaliações específicas (PA, HbA1c, etc.).
    *   Dashboard com lista de pacientes diabéticos e seus status.

7.  **Módulo E: Cuidado da Pessoa com Hipertensão** `src/modules/hypertension`
    *   Cálculo automático dos indicadores E1 a E4 (Consulta, PA, Antropometria, Visitas).
    *   Endpoint para registro de aferições de pressão e antropometria.
    *   Dashboard com lista de pacientes hipertensos e seus status.

8.  **Módulo F: Saúde do Idoso** `src/modules/elderly`
    *   Cálculo dos indicadores F1 (Polifarmácia) e F2 (IVCF-20).
    *   Registro de avaliações multidimensionais.
    *   Dashboard de acompanhamento da fragilidade.

9.  **Módulo G: Saúde da Mulher** `src/modules/woman-health`
    *   Indicadores G1 (Citopatológico) e G2 (Mamografia).
    *   Registro de exames preventivos com periodicidade automática (3 anos para CP e 2 anos para MMG).
    *   Dashboard de cobertura preventiva.

### Módulos Transversais e Infraestrutura

10. **Testes Unitários**:
    *   Implementação de suíte de testes com Jest e ts-jest.
    *   Mocks estáveis para Prisma Client (unidade isolada).
    *   Testes de lógica de indicadores para Diabetes, Hipertensão, Idoso e Saúde da Mulher.

11. **Segurança e RBAC (Role-Based Access Control)**:
    *   Middleware de autenticação JWT.
    *   Middleware de autorização por papéis (ACS, Enfermeiro, Médico, Técnico, Admin).
    *   Restrição de endpoints clínicos para profissionais de saúde especializados.

12. **Dashboard de Gestão**:
    *   Estatísticas agregadas por unidade e microárea.
    *   Identificação automática de pacientes prioritários (com indicadores críticos no vermelho).
    *   Visão consolidada para Enfermeiros e Gestores.

### Próximos Passos

1.  **Integração Mobile**: Validar os endpoints "offline-first" com o app mobile e sincronização de dados geolocalizados.
2.  **Logs de Auditoria**: Implementar o registro detalhado de alterações em dados sensíveis de pacientes por `AuditLog`.
3.  **Relatórios PDF**: Geração de relatórios consolidados para exportação de dados de produção do Previne Brasil.

