import { Request, Response, NextFunction } from 'express';
import { ChildcareService } from '../services/childcare.service';

const childcareService = new ChildcareService();

export class ChildcareController {
    /**
     * Registrar consulta de puericultura
     */
    async registerConsultation(req: Request, res: Response, next: NextFunction) {
        try {
            const consultation = await childcareService.registerConsultation(req.body);
            res.status(201).json({
                success: true,
                data: consultation,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Registrar aplicação de vacina
     */
    async registerVaccine(req: Request, res: Response, next: NextFunction) {
        try {
            const vaccineRecord = await childcareService.registerVaccine(req.body);
            res.status(201).json({
                success: true,
                data: vaccineRecord,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obter dados de puericultura
     */
    async getChildcareData(req: Request, res: Response, next: NextFunction) {
        try {
            const { patientId } = req.params;
            const childcareData = await childcareService.getChildcareData(patientId as string);

            res.json({
                success: true,
                data: childcareData,
            });
        } catch (error) {
            next(error);
        }
    }
}
