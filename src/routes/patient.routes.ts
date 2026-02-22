import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { validateMicroAreaAccess, filterByMicroArea } from '../middlewares/validateMicroArea';
import { UserRole } from '@prisma/client';

const router = Router();
const patientController = new PatientController();

// Todas as rotas de pacientes requerem autenticação
router.use(authenticate);

/**
 * @route   POST /patients
 * @desc    Cadastra um novo paciente
 * @access  Private (ACS, ENFERMEIRO, MEDICO, ADMIN)
 * @note    ACS só pode cadastrar pacientes na sua microárea
 */
router.post(
    '/',
    authorize(UserRole.ACS, UserRole.ENFERMEIRO, UserRole.MEDICO, UserRole.ADMIN),
    asyncHandler(patientController.create)
);

/**
 * @route   GET /patients
 * @desc    Lista pacientes com filtros
 * @access  Private (Todos os perfis)
 * @note    ACS vê apenas pacientes da sua microárea
 */
router.get('/', filterByMicroArea, asyncHandler(patientController.list));

/**
 * @route   GET /patients/:id
 * @desc    Busca um paciente por ID
 * @access  Private (Todos os perfis)
 * @note    ACS só acessa pacientes da sua microárea
 */
router.get('/:id', validateMicroAreaAccess, asyncHandler(patientController.getById));

/**
 * @route   PUT /patients/:id
 * @desc    Atualiza dados de um paciente
 * @access  Private (ACS, ENFERMEIRO, MEDICO)
 * @note    ACS só atualiza pacientes da sua microárea
 */
router.put(
    '/:id',
    authorize(UserRole.ACS, UserRole.ENFERMEIRO, UserRole.MEDICO),
    validateMicroAreaAccess,
    asyncHandler(patientController.update)
);

/**
 * @route   DELETE /patients/:id
 * @desc    Inativa um paciente (soft delete)
 * @access  Private (ENFERMEIRO, MEDICO, ADMIN)
 * @note    ACS não pode deletar pacientes
 */
router.delete(
    '/:id',
    authorize(UserRole.ENFERMEIRO, UserRole.MEDICO, UserRole.ADMIN),
    asyncHandler(patientController.delete)
);

/**
 * @route   GET /patients/:id/timeline
 * @desc    Retorna o histórico completo do paciente
 * @access  Private (Todos os perfis)
 * @note    ACS só acessa pacientes da sua microárea
 */
router.get('/:id/timeline', validateMicroAreaAccess, asyncHandler(patientController.getTimeline));

/**
 * @route   GET /patients/:id/indicators
 * @desc    Retorna o status de todos os indicadores do paciente
 * @access  Private (Todos os perfis)
 * @note    ACS só acessa pacientes da sua microárea
 */
router.get('/:id/indicators', validateMicroAreaAccess, asyncHandler(patientController.getIndicators));

export default router;
