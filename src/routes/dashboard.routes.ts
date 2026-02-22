import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const dashboardController = new DashboardController();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /dashboard/stats-by-period
 * Obter estatísticas por período
 * Acesso: ACS, TECNICO_ENFERMAGEM, ENFERMEIRO, MEDICO, ADMIN
 */
router.post(
  '/stats-by-period',
  authorize('ACS', 'TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
  dashboardController.getStatsByPeriod.bind(dashboardController)
);

/**
 * POST /dashboard/indicator-evolution
 * Obter evolução de indicadores por período
 * Acesso: ACS, TECNICO_ENFERMAGEM, ENFERMEIRO, MEDICO, ADMIN
 */
router.post(
  '/indicator-evolution',
  authorize('ACS', 'TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
  dashboardController.getIndicatorEvolution.bind(dashboardController)
);

/**
 * POST /dashboard/compare-periods
 * Comparar dois períodos
 * Acesso: ACS, TECNICO_ENFERMAGEM, ENFERMEIRO, MEDICO, ADMIN
 */
router.post(
  '/compare-periods',
  authorize('ACS', 'TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
  dashboardController.comparePeriods.bind(dashboardController)
);

export default router;
