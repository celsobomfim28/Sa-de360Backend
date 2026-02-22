import { Response } from 'express';
import { SharedActionsService } from '../services/sharedActions.service';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/errorHandler';

const sharedActionsService = new SharedActionsService();

export class SharedActionsController {
    /**
     * Registrar dados antropométricos (peso e altura)
     * POST /shared-actions/anthropometry
     */
    async registerAnthropometry(req: AuthRequest, res: Response) {
        try {
            const { patientId, measurementDate, weight, height, observations } = req.body;

            if (!patientId || !measurementDate || !weight || !height) {
                throw new AppError(400, 'Dados obrigatórios não fornecidos', 'MISSING_REQUIRED_FIELDS');
            }

            const record = await sharedActionsService.registerAnthropometry({
                patientId,
                registeredById: req.user!.id,
                measurementDate: new Date(measurementDate),
                weight: parseFloat(weight),
                height: parseFloat(height),
                observations,
            });

            res.status(201).json({
                success: true,
                message: 'Dados antropométricos registrados com sucesso',
                data: record,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Registrar aferição de pressão arterial
     * POST /shared-actions/blood-pressure
     */
    async registerBloodPressure(req: AuthRequest, res: Response) {
        try {
            const { patientId, measurementDate, systolicBP, diastolicBP, observations } = req.body;

            if (!patientId || !measurementDate || !systolicBP || !diastolicBP) {
                throw new AppError(400, 'Dados obrigatórios não fornecidos', 'MISSING_REQUIRED_FIELDS');
            }

            const record = await sharedActionsService.registerBloodPressure({
                patientId,
                registeredById: req.user!.id,
                measurementDate: new Date(measurementDate),
                systolicBP: parseInt(systolicBP),
                diastolicBP: parseInt(diastolicBP),
                observations,
            });

            res.status(201).json({
                success: true,
                message: 'Pressão arterial registrada com sucesso',
                data: record,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Registrar aplicação de vacina
     * POST /shared-actions/vaccine
     */
    async registerVaccine(req: AuthRequest, res: Response) {
        try {
            const { patientId, vaccineId, applicationDate, dose, batchNumber, observations } = req.body;

            if (!patientId || !vaccineId || !applicationDate || !dose) {
                throw new AppError(400, 'Dados obrigatórios não fornecidos', 'MISSING_REQUIRED_FIELDS');
            }

            const record = await sharedActionsService.registerVaccine({
                patientId,
                vaccineId,
                registeredById: req.user!.id,
                applicationDate: new Date(applicationDate),
                dose: parseInt(dose),
                batchNumber,
                observations,
            });

            res.status(201).json({
                success: true,
                message: 'Vacina registrada com sucesso',
                data: record,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obter histórico de ações compartilhadas de um paciente
     * GET /shared-actions/history/:patientId
     */
    async getPatientHistory(req: AuthRequest, res: Response) {
        try {
            const { patientId } = req.params;

            const history = await sharedActionsService.getPatientSharedActionsHistory(String(patientId));

            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            throw error;
        }
    }
}
