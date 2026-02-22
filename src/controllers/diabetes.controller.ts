import { Request, Response } from 'express';
import { DiabetesService } from '../services/diabetes.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class DiabetesController {
    private diabetesService: DiabetesService;

    constructor() {
        this.diabetesService = new DiabetesService();
    }

    create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const professionalId = req.user!.id;
        const consultation = await this.diabetesService.createConsultation({
            ...req.body,
            professionalId
        });

        res.status(201).json({
            message: 'Consulta de diabetes registrada com sucesso',
            data: consultation
        });
    });

    getHistory = asyncHandler(async (req: Request, res: Response) => {
        const { patientId } = req.params;
        const history = await this.diabetesService.getHistory(patientId as string);
        res.status(200).json({ data: history });
    });
}
