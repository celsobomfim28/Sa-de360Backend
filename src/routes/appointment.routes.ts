import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
const appointmentController = new AppointmentController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// CRUD de consultas
router.post('/', appointmentController.create);
router.get('/', appointmentController.list);
router.get('/:id', appointmentController.getById);
router.put('/:id', appointmentController.update);

// Ações específicas
router.post('/:id/give-notice', appointmentController.giveNotice);
router.post('/:id/mark-absence', appointmentController.markAbsence);
router.post('/:id/mark-completed', appointmentController.markCompleted);

// Agenda do ACS
router.get('/acs/:acsId/daily-agenda', appointmentController.getDailyAgenda);

// Pacientes faltosos
router.get('/absent-patients', appointmentController.getAbsentPatients);

export default router;
