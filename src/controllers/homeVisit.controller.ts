import { Request, Response, NextFunction } from 'express';
import { HomeVisitService } from '../services/homeVisit.service';

const homeVisitService = new HomeVisitService();

export class HomeVisitController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            // Pegar acsId do usuário autenticado
            const acsId = (req as any).user?.id;
            
            if (!acsId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autenticado',
                });
            }
            
            // Extrair procedimentos das observações se estiverem lá
            let weight, height, systolicBP, diastolicBP, glucose;
            
            if (req.body.observations) {
                const obs = req.body.observations;
                const weightMatch = obs.match(/Peso:\s*(\d+(?:\.\d+)?)\s*kg/i);
                const heightMatch = obs.match(/Altura:\s*(\d+(?:\.\d+)?)\s*cm/i);
                const bpMatch = obs.match(/PA:\s*(\d+)\/(\d+)\s*mmHg/i);
                const glucoseMatch = obs.match(/Glicemia:\s*(\d+)\s*mg\/dL/i);
                
                if (weightMatch) weight = parseFloat(weightMatch[1]);
                if (heightMatch) height = parseFloat(heightMatch[1]);
                if (bpMatch) {
                    systolicBP = parseInt(bpMatch[1]);
                    diastolicBP = parseInt(bpMatch[2]);
                }
                if (glucoseMatch) glucose = parseInt(glucoseMatch[1]);
            }
            
            // Converter visitDate de string para Date se necessário
            const visitData = {
                ...req.body,
                acsId,
                visitDate: req.body.visitDate ? new Date(req.body.visitDate) : new Date(),
                weight,
                height,
                systolicBP,
                diastolicBP,
                glucose,
            };
            
            console.log('[HomeVisit] Criando visita:', visitData);
            
            const homeVisit = await homeVisitService.create(visitData);
            
            res.status(201).json({
                success: true,
                data: homeVisit,
            });
        } catch (error) {
            console.error('[HomeVisit] Erro ao criar visita:', error);
            next(error);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { acsId, patientId, microAreaId, visitType, startDate, endDate, page = 1, limit = 20 } = req.query;

            console.log('[HomeVisit] Listando visitas com filtros:', {
                acsId,
                patientId,
                microAreaId,
                visitType,
                startDate,
                endDate,
                page,
                limit,
            });

            const result = await homeVisitService.list({
                acsId: acsId as string,
                patientId: patientId as string,
                microAreaId: microAreaId as string,
                visitType: visitType as string,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20,
            });

            console.log('[HomeVisit] Total de visitas encontradas:', result.data?.length || 0);

            res.json({
                success: true,
                ...result,
            });
        } catch (error) {
            console.error('[HomeVisit] Erro ao listar visitas:', error);
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const homeVisit = await homeVisitService.getById(id as string);

            res.json({
                success: true,
                data: homeVisit,
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const homeVisit = await homeVisitService.update(id as string, req.body);

            res.json({
                success: true,
                data: homeVisit,
            });
        } catch (error) {
            next(error);
        }
    }

    async getPendingVisits(req: Request, res: Response, next: NextFunction) {
        try {
            const { acsId } = req.params;
            const pendingVisits = await homeVisitService.getPendingVisits(acsId as string);

            res.json({
                success: true,
                data: pendingVisits,
            });
        } catch (error) {
            next(error);
        }
    }
}
