import { Request, Response } from 'express';
import predictiveService from '../services/predictive.service';

export class PredictiveController {
  async predictNoShows(req: Request, res: Response) {
    try {
      const { microAreaId } = req.query;
      const predictions = await predictiveService.predictAppointmentNoShows(microAreaId as string);
      res.json({ success: true, data: predictions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async identifyRiskPatients(req: Request, res: Response) {
    try {
      const { microAreaId } = req.query;
      const riskPatients = await predictiveService.identifyRiskPatients(microAreaId as string);
      res.json({ success: true, data: riskPatients });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async suggestActions(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const actions = await predictiveService.suggestPreventiveActions(String(patientId));
      res.json({ success: true, data: actions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async analyzeTrends(req: Request, res: Response) {
    try {
      const { microAreaId, months } = req.query;
      const trends = await predictiveService.analyzeTrends(
        microAreaId as string,
        months ? parseInt(months as string) : 6
      );
      res.json({ success: true, data: trends });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getSmartAlerts(req: Request, res: Response) {
    try {
      const { microAreaId } = req.query;
      const alerts = await predictiveService.generateSmartAlerts(microAreaId as string);
      res.json({ success: true, data: alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}

export default new PredictiveController();
