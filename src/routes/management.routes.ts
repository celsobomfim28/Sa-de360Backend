import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { ManagementController } from '../controllers/management.controller';

const router = Router();
const managementController = new ManagementController();

router.use(authenticate);

// Gestão de indicadores e prioridades - Acesso para profissionais de saúde
router.get(
    '/stats',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(managementController.getStats)
);

router.get(
    '/priority-list',
    authorize('ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(managementController.getPriorityList)
);

router.get(
    '/micro-areas',
    asyncHandler(managementController.getMicroAreas)
);

router.get(
    '/agents',
    asyncHandler(managementController.getAgents)
);

router.get(
    '/detailed-indicators',
    asyncHandler(managementController.getDetailedIndicators)
);

// CRUD de Microáreas - Acesso restrito a ADMIN
router.post(
    '/micro-areas',
    authorize('ADMIN'),
    asyncHandler(managementController.createMicroArea)
);

router.put(
    '/micro-areas/:id',
    authorize('ADMIN'),
    asyncHandler(managementController.updateMicroArea)
);

router.delete(
    '/micro-areas/:id',
    authorize('ADMIN'),
    asyncHandler(managementController.deleteMicroArea)
);

export default router;
