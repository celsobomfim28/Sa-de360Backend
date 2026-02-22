import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ManagementService } from '../services/management.service';

const managementService = new ManagementService();

export class ManagementController {
    async getStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId, agentId } = req.query;
            const data = await managementService.getGeneralStats(
                microAreaId as string,
                agentId as string
            );
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async getPriorityList(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId, agentId, indicatorId } = req.query;
            const data = await managementService.getPriorityList(
                microAreaId as string,
                agentId as string,
                indicatorId as string
            );
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async getAgents(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const agents = await managementService.getAgents();
            // Formatar resposta para camelCase
            const data = agents.map((agent: any) => ({
                id: agent.id,
                fullName: agent.fullName,
                microArea: agent.micro_areas
            }));
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async getMicroAreas(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await managementService.getMicroAreas();
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async getDetailedIndicators(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId, agentId } = req.query;
            const data = await managementService.getDetailedIndicators(
                microAreaId as string,
                agentId as string
            );
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async createMicroArea(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { name, code, description, acsId } = req.body;
            const data = await managementService.createMicroArea({ name, code, description, acsId });
            return res.status(201).json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async updateMicroArea(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { name, code, description, acsId } = req.body;
            const data = await managementService.updateMicroArea(id, { name, code, description, acsId });
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    async deleteMicroArea(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            await managementService.deleteMicroArea(id);
            return res.status(204).send();
        } catch (error) {
            return next(error);
        }
    }
}
