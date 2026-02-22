import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { SyncController } from '../controllers/sync.controller';

const router = Router();
const syncController = new SyncController();

router.use(authenticate);

router.post('/upload', authorize('ACS'), asyncHandler(syncController.upload));
router.get('/download', asyncHandler(syncController.download));

export default router;
