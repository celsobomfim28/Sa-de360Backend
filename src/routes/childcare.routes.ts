import { Router } from 'express';
import { ChildcareController } from '../controllers/childcare.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
const childcareController = new ChildcareController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Gestão da Puericultura
router.get('/:patientId', childcareController.getChildcareData);

// Consultas
router.post('/consultation', childcareController.registerConsultation);

// Vacinas
router.post('/vaccine', childcareController.registerVaccine);

export default router;
