import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ReportService } from '../services/report.service';

const reportService = new ReportService();

export class ReportController {
    /**
     * GET /reports/:reportId/pdf
     * Geração de PDF para qualquer relatório permitido ao perfil
     */
    async downloadReportPdf(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
            }

            const reportId = Array.isArray(req.params.reportId)
                ? req.params.reportId[0]
                : req.params.reportId;

            if (!reportId) {
                return res.status(400).json({ success: false, message: 'reportId é obrigatório' });
            }

            const pdfBuffer = await reportService.generateReportPdf(reportId, {
                id: user.id,
                role: user.role,
                microAreaId: user.microAreaId,
            }, req.query as Record<string, any>);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${reportId}-${Date.now()}.pdf"`);
            return res.status(200).send(pdfBuffer);
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/micro-area
     * Relatório da Microárea (ACS)
     */
    async getMicroAreaReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const acsId = req.user?.id;
            if (!acsId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
            }
            const data = await reportService.getMicroAreaReport(acsId);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/home-visits
     * Relatório de Visitas Domiciliares (ACS)
     */
    async getHomeVisitsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const acsId = req.user?.id;
            if (!acsId) {
                return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
            }
            const { startDate, endDate } = req.query;
            const data = await reportService.getHomeVisitsReport(
                acsId,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/active-search
     * Relatório de Busca Ativa (ACS)
     */
    async getActiveSearchReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            if (!microAreaId) {
                return res.status(400).json({ success: false, message: 'microAreaId é obrigatório' });
            }
            const data = await reportService.getActiveSearchReport(microAreaId as string);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/procedures
     * Relatório de Procedimentos Realizados (Técnico)
     */
    async getProceduresReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { professionalId, startDate, endDate } = req.query;
            const data = await reportService.getProceduresReport(
                professionalId as string | undefined,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/pending-exams
     * Relatório de Exames Pendentes (Técnico/Médico)
     */
    async getPendingExamsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await reportService.getPendingExamsReport();
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/team-production
     * Relatório de Produção da Equipe (Enfermeiro/Admin)
     */
    async getTeamProductionReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate, microAreaId } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'startDate e endDate são obrigatórios' 
                });
            }
            const data = await reportService.getTeamProductionReport(
                new Date(startDate as string),
                new Date(endDate as string),
                microAreaId as string | undefined
            );
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/chronic-patients
     * Relatório de Pacientes Crônicos por Risco (Médico)
     */
    async getChronicPatientsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getChronicPatientsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/micro-areas
     * Lista de microáreas para filtros
     */
    async getMicroAreas(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const microAreas = await reportService.getMicroAreas();
            return res.json({ success: true, data: microAreas });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/professionals
     * Lista de profissionais para filtros
     */
    async getProfessionals(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const professionals = await reportService.getProfessionals();
            return res.json({ success: true, data: professionals });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/childcare-indicators
     * Relatório de Indicadores de Puericultura (C2)
     */
    async getChildcareIndicatorsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getChildcareIndicatorsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/prenatal-indicators
     * Relatório de Indicadores de Pré-Natal (C3)
     */
    async getPrenatalIndicatorsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getPrenatalIndicatorsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/diabetes-indicators
     * Relatório de Indicadores de Diabetes (C4)
     */
    async getDiabetesIndicatorsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getDiabetesIndicatorsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/hypertension-indicators
     * Relatório de Indicadores de Hipertensão (C5)
     */
    async getHypertensionIndicatorsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getHypertensionIndicatorsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/elderly-indicators
     * Relatório de Indicadores de Idoso (C6)
     */
    async getElderlyIndicatorsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getElderlyIndicatorsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }

    /**
     * GET /reports/woman-health-indicators
     * Relatório de Indicadores de Saúde da Mulher (C7)
     */
    async getWomanHealthIndicatorsReport(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { microAreaId } = req.query;
            const data = await reportService.getWomanHealthIndicatorsReport(microAreaId as string | undefined);
            return res.json({ success: true, data });
        } catch (error) {
            return next(error);
        }
    }
}
