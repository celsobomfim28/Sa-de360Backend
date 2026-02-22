import { Router } from 'express';
import telemedicineController from '../controllers/telemedicine.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/schedule', authorize('MEDICO', 'ENFERMEIRO', 'ADMIN'), telemedicineController.scheduleTeleconsultation);
router.get('/consultations', telemedicineController.listTeleconsultations);
router.post('/prescription', authorize('MEDICO', 'ADMIN'), telemedicineController.generatePrescription);
router.post('/certificate', authorize('MEDICO', 'ADMIN'), telemedicineController.generateCertificate);
router.get('/stats', telemedicineController.getStats);

export default router;
