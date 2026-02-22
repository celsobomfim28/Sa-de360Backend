import { Router } from 'express';
import { DiabetesController } from '../controllers/diabetes.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();
const diabetesController = new DiabetesController();

router.use(authenticate);

// Registration of new consultations
router.post(
    '/',
    authorize('ENFERMEIRO', 'MEDICO', 'TECNICO_ENFERMAGEM', 'ADMIN'),
    diabetesController.create
);

// History per patient
router.get(
    '/patient/:patientId',
    diabetesController.getHistory
);

export default router;
