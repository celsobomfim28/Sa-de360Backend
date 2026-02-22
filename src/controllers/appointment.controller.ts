import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';


const appointmentService = new AppointmentService();

export class AppointmentController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const appointment = await appointmentService.create(req.body);
            res.status(201).json({
                success: true,
                data: appointment,
            });
        } catch (error) {
            next(error);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const { date, professionalId, patientId, microAreaId, status, type, page = 1, limit = 20 } = req.query;

            const result = await appointmentService.list({
                date: date ? new Date(date as string) : undefined,
                professionalId: professionalId as string,
                patientId: patientId as string,
                microAreaId: microAreaId as string,
                status: status as string,
                type: type as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20,
            });

            res.json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService.getById(id as string);

            res.json({
                success: true,
                data: appointment,
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService.update(id as string, req.body);

            res.json({
                success: true,
                data: appointment,
            });
        } catch (error) {
            next(error);
        }
    }

    async giveNotice(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { acsId } = req.body;

            const appointment = await appointmentService.giveNotice(id as string, { acsId });

            res.json({
                success: true,
                data: appointment,
                message: 'Aviso de consulta registrado com sucesso',
            });
        } catch (error) {
            next(error);
        }
    }

    async markAbsence(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { absenceReason, reportedById } = req.body;

            const appointment = await appointmentService.markAbsence(id as string, {
                absenceReason,
                reportedById,
            });

            res.json({
                success: true,
                data: appointment,
                message: 'Falta registrada com sucesso',
            });
        } catch (error) {
            next(error);
        }
    }

    async markCompleted(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService.markCompleted(id as string);

            res.json({
                success: true,
                data: appointment,
                message: 'Consulta marcada como realizada',
            });
        } catch (error) {
            next(error);
        }
    }

    async getDailyAgenda(req: Request, res: Response, next: NextFunction) {
        try {
            const { acsId } = req.params;
            const { date } = req.query;

            const agenda = await appointmentService.getDailyAgenda(
                acsId as string,
                date ? new Date(date as string) : new Date()
            );

            res.json({
                success: true,
                data: agenda,
            });
        } catch (error) {
            next(error);
        }
    }

    async getAbsentPatients(req: Request, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;

            const absentPatients = await appointmentService.getAbsentPatients(
                microAreaId as string
            );

            res.json({
                success: true,
                data: absentPatients,
            });
        } catch (error) {
            next(error);
        }
    }
}
