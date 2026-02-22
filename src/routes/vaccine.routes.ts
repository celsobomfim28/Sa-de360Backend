import { Router } from 'express';
import { VaccineController } from '../controllers/vaccine.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
const vaccineController = new VaccineController();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /vaccines
 * Listar catálogo de vacinas
 * Acesso: Todos os usuários autenticados
 */
router.get('/', vaccineController.listVaccines.bind(vaccineController));

/**
 * GET /vaccines/schedule/:patientId
 * Obter calendário vacinal do paciente
 * Acesso: Todos os usuários autenticados
 */
router.get('/schedule/:patientId', vaccineController.getVaccineSchedule.bind(vaccineController));

/**
 * POST /vaccines/apply
 * Registrar aplicação de vacina
 * Acesso: Todos os profissionais (MEDICO, ENFERMEIRO, TECNICO_ENFERMAGEM, ACS)
 */
router.post('/apply', vaccineController.registerVaccineApplication.bind(vaccineController));

/**
 * GET /vaccines/pending/:patientId
 * Verificar vacinas pendentes
 * Acesso: Todos os usuários autenticados
 */
router.get('/pending/:patientId', vaccineController.checkPendingVaccines.bind(vaccineController));

/**
 * GET /vaccines/card/:patientId
 * Obter cartão de vacinação completo
 * Acesso: Todos os usuários autenticados
 */
router.get('/card/:patientId', vaccineController.getVaccinationCard.bind(vaccineController));

export default router;
