import { Request, Response } from 'express';
import { LabExamService } from '../services/labExam.service';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth';

const labExamService = new LabExamService();

// Validações
const createExamRequestSchema = z.object({
  patientId: z.string().uuid(),
  examTypes: z.array(z.string()),
  priority: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
  clinicalInfo: z.string().optional(),
});

const registerCollectionSchema = z.object({
  collectionDate: z.string().datetime(),
  collectedBy: z.string(),
});

const registerResultSchema = z.object({
  resultDate: z.string().datetime(),
  result: z.any().optional(),
  resultText: z.string().optional(),
  referenceRange: z.string().optional(),
  interpretation: z.enum(['NORMAL', 'ALTERED', 'CRITICAL']).optional(),
});

const evaluateExamSchema = z.object({
  observations: z.string().optional(),
});

export class LabExamController {
  private isModuleUnavailableError(error: any) {
    return typeof error?.message === 'string' &&
      error.message.includes('Módulo de exames laboratoriais não está configurado');
  }

  /**
   * POST /lab-exams/requests
   * Criar solicitação de exames
   */
  async createExamRequest(req: AuthRequest, res: Response) {
    try {
      const validatedData = createExamRequestSchema.parse(req.body);
      const requestedById = req.user!.id;

      const request = await labExamService.createExamRequest({
        ...validatedData,
        examTypes: validatedData.examTypes as any[],
        requestedById
      });

      res.status(201).json(request);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /lab-exams/requests
   * Listar solicitações de exames
   */
  async listExamRequests(req: Request, res: Response) {
    try {
      const { patientId, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (patientId) filters.patientId = patientId as string;
      if (status) filters.status = status as any;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const requests = await labExamService.listExamRequests(filters);

      res.json(requests);
    } catch (error: any) {
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /lab-exams/requests/:id
   * Obter detalhes de uma solicitação
   */
  async getExamRequest(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const request = await labExamService.getExamRequest(id);

      res.json(request);
    } catch (error: any) {
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * POST /lab-exams/:examId/collection
   * Registrar coleta de exame
   */
  async registerCollection(req: Request, res: Response) {
    try {
      const examId = req.params.examId as string;
      const validatedData = registerCollectionSchema.parse(req.body);

      const exam = await labExamService.registerCollection(examId, {
        collectionDate: new Date(validatedData.collectionDate),
        collectedBy: validatedData.collectedBy
      });

      res.json(exam);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /lab-exams/:examId/result
   * Registrar resultado de exame
   */
  async registerResult(req: Request, res: Response) {
    try {
      const examId = req.params.examId as string;
      const validatedData = registerResultSchema.parse(req.body);

      const exam = await labExamService.registerResult(examId, {
        resultDate: new Date(validatedData.resultDate),
        result: validatedData.result,
        resultText: validatedData.resultText,
        referenceRange: validatedData.referenceRange,
        interpretation: validatedData.interpretation as any
      });

      res.json(exam);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /lab-exams/:examId/evaluate
   * Avaliar resultado de exame
   */
  async evaluateExam(req: AuthRequest, res: Response) {
    try {
      const examId = req.params.examId as string;
      const validatedData = evaluateExamSchema.parse(req.body);
      const evaluatedById = req.user!.id;

      const exam = await labExamService.evaluateExam(examId, {
        evaluatedById,
        observations: validatedData.observations
      });

      res.json(exam);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /lab-exams/requests/:id
   * Cancelar solicitação de exame
   */
  async cancelExamRequest(req: Request, res: Response) {
    try {
      const id = req.params.id as string;

      const request = await labExamService.cancelExamRequest(id);

      res.json(request);
    } catch (error: any) {
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /lab-exams/patients/:patientId/history
   * Obter histórico de exames do paciente
   */
  async getPatientExamHistory(req: Request, res: Response) {
    try {
      const patientId = req.params.patientId as string;
      const { examType } = req.query;

      const history = await labExamService.getPatientExamHistory(
        patientId,
        examType as any
      );

      res.json(history);
    } catch (error: any) {
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /lab-exams/pending-evaluations
   * Obter exames pendentes de avaliação
   */
  async getPendingEvaluations(req: Request, res: Response) {
    try {
      const exams = await labExamService.getPendingEvaluations();

      res.json(exams);
    } catch (error: any) {
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /lab-exams/statistics
   * Obter estatísticas de exames
   */
  async getExamStatistics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const statistics = await labExamService.getExamStatistics(filters);

      res.json(statistics);
    } catch (error: any) {
      if (this.isModuleUnavailableError(error)) {
        return res.status(503).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}
