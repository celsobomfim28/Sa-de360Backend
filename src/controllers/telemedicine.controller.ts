import { Request, Response } from 'express';
import telemedicineService from '../services/telemedicine.service';

export class TelemedicineController {
  async scheduleTeleconsultation(req: Request, res: Response) {
    try {
      const result = await telemedicineService.scheduleTeleconsultation(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async listTeleconsultations(req: Request, res: Response) {
    try {
      const { professionalId, patientId, status, startDate, endDate } = req.query;
      const result = await telemedicineService.listTeleconsultations({
        professionalId: professionalId as string,
        patientId: patientId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async generatePrescription(req: Request, res: Response) {
    try {
      const result = await telemedicineService.generatePrescription(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async generateCertificate(req: Request, res: Response) {
    try {
      const result = await telemedicineService.generateMedicalCertificate(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const { professionalId, startDate, endDate } = req.query;
      const result = await telemedicineService.getTelemedicineStats({
        professionalId: professionalId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}

export default new TelemedicineController();
