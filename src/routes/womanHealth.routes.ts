import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { WomanHealthController } from '../controllers/womanHealth.controller';

const router = Router();
const womanHealthController = new WomanHealthController();

router.use(authenticate);

router.get('/dashboard', asyncHandler(womanHealthController.getDashboard));

// Registrar exame (Citopatológico ou Mamografia)
router.post(
    '/:id/exam',
    authorize('ENFERMEIRO', 'MEDICO', 'TECNICO_ENFERMAGEM', 'ADMIN'),
    asyncHandler(womanHealthController.registerExam)
);

// Registrar consulta de saúde sexual e reprodutiva
router.post(
    '/:id/consultation',
    authorize('ENFERMEIRO', 'MEDICO', 'ADMIN'),
    asyncHandler(womanHealthController.registerConsultation)
);

// Obter dados completos de saúde da mulher de uma paciente
router.get('/:id', asyncHandler(womanHealthController.getPatientData));

export default router;
