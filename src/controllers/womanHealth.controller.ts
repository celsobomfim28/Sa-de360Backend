import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { WomanHealthService } from '../services/womanHealth.service';

const womanHealthService = new WomanHealthService();

export class WomanHealthController {
    async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await womanHealthService.getDashboardData(microAreaId as string);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async registerExam(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;
            // { type, examDate, result, observations }

            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const exam = await womanHealthService.registerExam({
                ...data,
                patientId: id,
                performedById: req.user.id,
                examDate: new Date(data.examDate)
            });

            return res.json({ success: true, data: exam });
        } catch (error) {
            return next(error);
        }
    }

    async registerConsultation(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;
            // { consultationDate, consultationType, topics, contraceptiveMethodDiscussed, contraceptiveMethodPrescribed, observations }

            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const consultation = await womanHealthService.registerConsultation({
                ...data,
                patientId: id,
                professionalId: req.user.id,
                consultationDate: new Date(data.consultationDate)
            });

            return res.json({ success: true, data: consultation });
        } catch (error) {
            return next(error);
        }
    }

    async getPatientData(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = await womanHealthService.getPatientData(String(id));
            
            if (!data) {
                return res.status(404).json({ error: 'Paciente não encontrado' });
            }

            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }
}
