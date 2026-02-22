import { Request, Response } from 'express';
import { HypertensionService } from '../services/hypertension.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class HypertensionController {
    private hypertensionService: HypertensionService;

    constructor() {
        this.hypertensionService = new HypertensionService();
    }

    create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const professionalId = req.user!.id;
        const consultation = await this.hypertensionService.createConsultation({
            ...req.body,
            professionalId
        });

        res.status(201).json({
            message: 'Consulta de hipertensão registrada com sucesso',
            data: consultation
        });
    });

    getHistory = asyncHandler(async (req: Request, res: Response) => {
        const { patientId } = req.params;
        const history = await this.hypertensionService.getHistory(patientId as string);
        res.status(200).json({ data: history });
    });
}
