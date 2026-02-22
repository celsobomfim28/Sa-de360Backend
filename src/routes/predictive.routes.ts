import { Router } from 'express';
import predictiveController from '../controllers/predictive.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/no-shows', predictiveController.predictNoShows);
router.get('/risk-patients', predictiveController.identifyRiskPatients);
router.get('/actions/:patientId', predictiveController.suggestActions);
router.get('/trends', predictiveController.analyzeTrends);
router.get('/smart-alerts', predictiveController.getSmartAlerts);

export default router;
