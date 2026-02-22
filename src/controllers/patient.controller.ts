import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PatientService } from '../services/patient.service';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator';

export class PatientController {
    private patientService: PatientService;

    constructor() {
        this.patientService = new PatientService();
    }

    create = async (req: AuthRequest, res: Response) => {
        const data = createPatientSchema.parse(req.body);
        const createdById = req.user!.id;

        const patient = await this.patientService.create(data, createdById);

        res.status(201).json(patient);
    };

    list = async (req: AuthRequest, res: Response) => {
        const {
            name,
            cpf,
            cns,
            microAreaId,
            agentId,
            eligibilityGroup,
            status,
            ageMin,
            ageMax,
            page = '1',
            limit = '20',
        } = req.query;

        const result = await this.patientService.list({
            name: name as string,
            cpf: cpf as string,
            cns: cns as string,
            microAreaId: microAreaId as string,
            agentId: agentId as string,
            eligibilityGroup: eligibilityGroup as string,
            status: status as string,
            ageMin: ageMin ? parseInt(ageMin as string, 10) : undefined,
            ageMax: ageMax ? parseInt(ageMax as string, 10) : undefined,
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
        });

        res.status(200).json(result);
    };

    getById = async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        const patient = await this.patientService.getById(id as string);

        res.status(200).json({
            success: true,
            data: patient,
        });
    };

    update = async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const data = updatePatientSchema.parse(req.body);

        const patient = await this.patientService.update(id as string, data);

        res.status(200).json({
            success: true,
            data: patient,
        });
    };

    delete = async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        await this.patientService.delete(id as string);

        res.status(204).send();
    };

    getTimeline = async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        const timeline = await this.patientService.getTimeline(id as string);

        res.status(200).json(timeline);
    };

    getIndicators = async (req: AuthRequest, res: Response) => {
        const { id } = req.params;

        const indicators = await this.patientService.getIndicators(id as string);

        res.status(200).json(indicators);
    };
}
