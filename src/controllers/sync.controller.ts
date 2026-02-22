import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { SyncService } from '../services/sync.service';

const syncService = new SyncService();

export class SyncController {
    upload = async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Usuário não autenticado',
                },
            });
        }

        const result = await syncService.upload(userId, req.body);
        return res.status(200).json(result);
    };

    download = async (req: Request, res: Response) => {
        const { lastSyncAt } = req.query;
        const result = await syncService.download(lastSyncAt as string | undefined);
        return res.status(200).json(result);
    };
}
