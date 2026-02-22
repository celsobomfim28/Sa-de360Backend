import { Router } from 'express';
import { SharedActionsController } from '../controllers/sharedActions.controller';
import { authenticate } from '../middlewares/auth';
import { validateMicroAreaAccess } from '../middlewares/validateMicroArea';

const router = Router();
const sharedActionsController = new SharedActionsController();

// Todas as rotas requerem autenticação
// Qualquer profissional autenticado pode registrar ações compartilhadas
router.use(authenticate);

/**
 * Ações Compartilhadas (TODOS)
 * Baseado no documento INDINCADORESERESPONSABILIDADES.md
 * 
 * Estas ações podem ser realizadas por qualquer profissional:
 * - ADMIN
 * - MEDICO
 * - ENFERMEIRO
 * - TECNICO_ENFERMAGEM
 * - ACS (apenas para pacientes da sua microárea)
 */

// Registrar dados antropométricos (peso e altura)
// Responsabilidade compartilhada em: C2, C3, C4, C5, C6
// ACS só pode registrar para pacientes da sua microárea
router.post('/anthropometry', validateMicroAreaAccess, sharedActionsController.registerAnthropometry);

// Registrar aferição de pressão arterial
// Responsabilidade compartilhada em: C3, C4, C5
// ACS só pode registrar para pacientes da sua microárea
router.post('/blood-pressure', validateMicroAreaAccess, sharedActionsController.registerBloodPressure);

// Registrar aplicação de vacina
// Responsabilidade compartilhada em: C2, C3, C6, C7
// ACS só pode registrar para pacientes da sua microárea
router.post('/vaccine', validateMicroAreaAccess, sharedActionsController.registerVaccine);

// Obter histórico de ações compartilhadas de um paciente
// ACS só pode ver histórico de pacientes da sua microárea
router.get('/history/:patientId', validateMicroAreaAccess, sharedActionsController.getPatientHistory);

export default router;
