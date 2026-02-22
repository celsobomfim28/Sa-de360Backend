import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { ElderlyController } from '../controllers/elderly.controller';

const router = Router();
const elderlyController = new ElderlyController();

router.use(authenticate);

router.get('/dashboard', asyncHandler(elderlyController.getDashboard));
router.post(
    '/:id/consultation',
    authorize('ENFERMEIRO', 'MEDICO', 'TECNICO_ENFERMAGEM', 'ADMIN'),
    asyncHandler(elderlyController.registerConsultation)
);

export default router;
