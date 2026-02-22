import { Router } from 'express';
import { LabExamController } from '../controllers/labExam.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const labExamController = new LabExamController();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /lab-exams/requests
 * Criar solicitação de exames
 * Acesso: MEDICO, ENFERMEIRO
 */
router.post(
  '/requests',
  authorize('MEDICO', 'ENFERMEIRO'),
  labExamController.createExamRequest.bind(labExamController)
);

/**
 * GET /lab-exams/requests
 * Listar solicitações de exames
 * Acesso: Todos os usuários autenticados
 */
router.get('/requests', labExamController.listExamRequests.bind(labExamController));

/**
 * GET /lab-exams/requests/:id
 * Obter detalhes de uma solicitação
 * Acesso: Todos os usuários autenticados
 */
router.get('/requests/:id', labExamController.getExamRequest.bind(labExamController));

/**
 * POST /lab-exams/:examId/collection
 * Registrar coleta de exame
 * Acesso: TECNICO_ENFERMAGEM, ENFERMEIRO
 */
router.post(
  '/:examId/collection',
  authorize('TECNICO_ENFERMAGEM', 'ENFERMEIRO'),
  labExamController.registerCollection.bind(labExamController)
);

/**
 * POST /lab-exams/:examId/result
 * Registrar resultado de exame
 * Acesso: TECNICO_ENFERMAGEM, ENFERMEIRO, MEDICO
 */
router.post(
  '/:examId/result',
  authorize('TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'MEDICO'),
  labExamController.registerResult.bind(labExamController)
);

/**
 * POST /lab-exams/:examId/evaluate
 * Avaliar resultado de exame
 * Acesso: ENFERMEIRO, MEDICO
 */
router.post(
  '/:examId/evaluate',
  authorize('ENFERMEIRO', 'MEDICO'),
  labExamController.evaluateExam.bind(labExamController)
);

/**
 * DELETE /lab-exams/requests/:id
 * Cancelar solicitação de exame
 * Acesso: MEDICO, ENFERMEIRO
 */
router.delete(
  '/requests/:id',
  authorize('MEDICO', 'ENFERMEIRO'),
  labExamController.cancelExamRequest.bind(labExamController)
);

/**
 * GET /lab-exams/patients/:patientId/history
 * Obter histórico de exames do paciente
 * Acesso: Todos os usuários autenticados
 */
router.get(
  '/patients/:patientId/history',
  labExamController.getPatientExamHistory.bind(labExamController)
);

/**
 * GET /lab-exams/pending-evaluations
 * Obter exames pendentes de avaliação
 * Acesso: ENFERMEIRO, MEDICO
 */
router.get(
  '/pending-evaluations',
  authorize('ENFERMEIRO', 'MEDICO'),
  labExamController.getPendingEvaluations.bind(labExamController)
);

/**
 * GET /lab-exams/statistics
 * Obter estatísticas de exames
 * Acesso: ENFERMEIRO, MEDICO, ADMIN
 */
router.get(
  '/statistics',
  authorize('ENFERMEIRO', 'MEDICO', 'ADMIN'),
  labExamController.getExamStatistics.bind(labExamController)
);

export default router;
