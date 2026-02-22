import { Router } from 'express';
import { HypertensionController } from '../controllers/hypertension.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();
const hypertensionController = new HypertensionController();

router.use(authenticate);

// Registration of new consultations
router.post(
    '/',
    authorize('ENFERMEIRO', 'MEDICO', 'TECNICO_ENFERMAGEM', 'ADMIN'),
    hypertensionController.create
);

// History per patient
router.get(
    '/patient/:patientId',
    hypertensionController.getHistory
);

export default router;
