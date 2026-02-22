import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ElderlyService } from '../services/elderly.service';

const elderlyService = new ElderlyService();

export class ElderlyController {
    async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await elderlyService.getDashboardData(microAreaId as string);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async registerConsultation(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body;
            // { consultationDate, ivcfScore, medicationsCount, medicationsList, observations }

            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const consultation = await elderlyService.registerConsultation({
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
}
