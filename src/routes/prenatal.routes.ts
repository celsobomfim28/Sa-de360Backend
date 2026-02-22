import { Router } from 'express';
import { PrenatalController } from '../controllers/prenatal.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
const prenatalController = new PrenatalController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Gestão do Pré-Natal
router.post('/start', prenatalController.startPrenatal);
router.get('/:patientId', prenatalController.getPrenatalData);

// Consultas
router.post('/consultation', prenatalController.registerConsultation);
router.post('/postpartum-consultation', prenatalController.registerPostpartumConsultation);

// Exames
router.post('/exam', prenatalController.registerExam);

export default router;
