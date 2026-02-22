import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { ReportController } from '../controllers/report.controller';

const router = Router();
const reportController = new ReportController();

router.use(authenticate);

/**
 * GET /reports/:reportId/pdf
 * Download do relatório em PDF
 * Acesso: autenticado (validação de perfil é feita no service)
 */
router.get(
    '/:reportId/pdf',
    asyncHandler(reportController.downloadReportPdf)
);

/**
 * GET /reports/micro-area
 * Relatório da Microárea - Panorama completo de famílias e pessoas
 * Acesso: ACS
 */
router.get(
    '/micro-area',
    authorize('ACS'),
    asyncHandler(reportController.getMicroAreaReport)
);

/**
 * GET /reports/home-visits
 * Relatório de Visitas Domiciliares Realizadas
 * Query params: startDate, endDate (opcional)
 * Acesso: ACS
 */
router.get(
    '/home-visits',
    authorize('ACS'),
    asyncHandler(reportController.getHomeVisitsReport)
);

/**
 * GET /reports/active-search
 * Relatório de Busca Ativa - Pacientes com pendências
 * Query params: microAreaId (obrigatório)
 * Acesso: ACS
 */
router.get(
    '/active-search',
    authorize('ACS'),
    asyncHandler(reportController.getActiveSearchReport)
);

/**
 * GET /reports/procedures
 * Relatório de Procedimentos Realizados
 * Query params: professionalId, startDate, endDate (opcional)
 * Acesso: TECNICO_ENFERMAGEM, ENFERMEIRO, ADMIN
 */
router.get(
    '/procedures',
    authorize('TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'ADMIN'),
    asyncHandler(reportController.getProceduresReport)
);

/**
 * GET /reports/pending-exams
 * Relatório de Exames Pendentes
 * Acesso: TECNICO_ENFERMAGEM, MEDICO, ENFERMEIRO, ADMIN
 */
router.get(
    '/pending-exams',
    authorize('TECNICO_ENFERMAGEM', 'MEDICO', 'ENFERMEIRO', 'ADMIN'),
    asyncHandler(reportController.getPendingExamsReport)
);

/**
 * GET /reports/team-production
 * Relatório de Produção da Equipe
 * Query params: startDate, endDate (obrigatório), microAreaId (opcional)
 * Acesso: ENFERMEIRO, ADMIN
 */
router.get(
    '/team-production',
    authorize('ENFERMEIRO', 'ADMIN'),
    asyncHandler(reportController.getTeamProductionReport)
);

/**
 * GET /reports/chronic-patients
 * Relatório de Pacientes Crônicos por Risco
 * Query params: microAreaId (opcional)
 * Acesso: MEDICO, ENFERMEIRO, ADMIN
 */
router.get(
    '/chronic-patients',
    authorize('MEDICO', 'ENFERMEIRO', 'ADMIN'),
    asyncHandler(reportController.getChronicPatientsReport)
);

/**
 * GET /reports/micro-areas
 * Lista de microáreas para filtros
 * Acesso: Todos os usuários autenticados
 */
router.get(
    '/micro-areas',
    asyncHandler(reportController.getMicroAreas)
);

/**
 * GET /reports/professionals
 * Lista de profissionais para filtros
 * Acesso: Todos os usuários autenticados
 */
router.get(
    '/professionals',
    asyncHandler(reportController.getProfessionals)
);

/**
 * GET /reports/childcare-indicators
 * Relatório de Indicadores de Puericultura (C2)
 * Query params: microAreaId (opcional)
 * Acesso: ACS, ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
    '/childcare-indicators',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(reportController.getChildcareIndicatorsReport)
);

/**
 * GET /reports/prenatal-indicators
 * Relatório de Indicadores de Pré-Natal (C3)
 * Query params: microAreaId (opcional)
 * Acesso: ACS, ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
    '/prenatal-indicators',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(reportController.getPrenatalIndicatorsReport)
);

/**
 * GET /reports/diabetes-indicators
 * Relatório de Indicadores de Diabetes (C4)
 * Query params: microAreaId (opcional)
 * Acesso: ACS, ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
    '/diabetes-indicators',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(reportController.getDiabetesIndicatorsReport)
);

/**
 * GET /reports/hypertension-indicators
 * Relatório de Indicadores de Hipertensão (C5)
 * Query params: microAreaId (opcional)
 * Acesso: ACS, ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
    '/hypertension-indicators',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(reportController.getHypertensionIndicatorsReport)
);

/**
 * GET /reports/elderly-indicators
 * Relatório de Indicadores de Idoso (C6)
 * Query params: microAreaId (opcional)
 * Acesso: ACS, ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
    '/elderly-indicators',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(reportController.getElderlyIndicatorsReport)
);

/**
 * GET /reports/woman-health-indicators
 * Relatório de Indicadores de Saúde da Mulher (C7)
 * Query params: microAreaId (opcional)
 * Acesso: ACS, ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
    '/woman-health-indicators',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(reportController.getWomanHealthIndicatorsReport)
);

export default router;
