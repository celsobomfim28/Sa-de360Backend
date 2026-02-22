import { Request, Response, NextFunction } from 'express';
import { PrenatalService } from '../services/prenatal.service';

const prenatalService = new PrenatalService();

export class PrenatalController {
    /**:
     * Iniciar pré-natal
     */
    async startPrenatal(req: Request, res: Response, next: NextFunction) {
        try {
            const prenatalData = await prenatalService.startPrenatal(req.body);
            res.status(201).json({
                success: true,
                data: prenatalData,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Registrar consulta de pré-natal
     */
    async registerConsultation(req: Request, res: Response, next: NextFunction) {
        try {
            const consultation = await prenatalService.registerConsultation(req.body);
            res.status(201).json({
                success: true,
                data: consultation,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Registrar consulta de puerpério
     */
    async registerPostpartumConsultation(req: Request, res: Response, next: NextFunction) {
        try {
            const consultation = await prenatalService.registerPostpartumConsultation(req.body);
            res.status(201).json({
                success: true,
                data: consultation,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Registrar exame de pré-natal
     */
    async registerExam(req: Request, res: Response, next: NextFunction) {
        try {
            const exam = await prenatalService.registerExam(req.body);
            res.status(201).json({
                success: true,
                data: exam,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obter dados de pré-natal de uma paciente
     */
    async getPrenatalData(req: Request, res: Response, next: NextFunction) {
        try {
            const { patientId } = req.params;
            const prenatalData = await prenatalService.getPrenatalData(patientId as string);

            if (!prenatalData) {
                res.status(404).json({
                    success: false,
                    message: 'Pré-natal não encontrado para esta paciente',
                });
                return;
            }

            res.json({
                success: true,
                data: prenatalData,
            });
        } catch (error) {
            next(error);
        }
    }
}
