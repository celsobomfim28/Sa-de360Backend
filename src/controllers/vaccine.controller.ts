import { Request, Response } from 'express';
import { VaccineService } from '../services/vaccine.service';
import { z } from 'zod';

const vaccineService = new VaccineService();

// Validação para registro de vacina
const registerVaccineSchema = z.object({
  patientId: z.string().uuid(),
  vaccineId: z.string().uuid(),
  applicationDate: z.string().datetime(),
  dose: z.number().int().positive(),
  batchNumber: z.string().optional(),
});

export class VaccineController {
  /**
   * GET /vaccines
   * Listar catálogo de vacinas
   */
  async listVaccines(req: Request, res: Response) {
    try {
      const vaccines = await vaccineService.listVaccines();
      
      res.json(vaccines);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /vaccines/schedule/:patientId
   * Obter calendário vacinal do paciente
   */
  async getVaccineSchedule(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const user = req.user!;

      // Validar acesso de microárea para ACS
      if (user.role === 'ACS') {
        const { prisma } = await import('../config/database');
        
        const patient = await prisma.patients.findUnique({
          where: { id: patientId },
          select: { microAreaId: true }
        });

        if (!patient) {
          return res.status(404).json({ 
            error: { 
              code: 'PATIENT_NOT_FOUND', 
              message: 'Paciente não encontrado' 
            } 
          });
        }

        if (patient.microAreaId !== user.microAreaId) {
          return res.status(403).json({ 
            error: { 
              code: 'MICROAREA_ACCESS_DENIED', 
              message: 'Você não tem permissão para acessar pacientes de outra microárea' 
            } 
          });
        }
      }
      
      const schedule = await vaccineService.getVaccineSchedule(String(patientId));
      
      res.json(schedule);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * POST /vaccines/apply
   * Registrar aplicação de vacina
   */
  async registerVaccineApplication(req: Request, res: Response) {
    try {
      const validatedData = registerVaccineSchema.parse(req.body);
      const appliedById = req.user!.id;
      const user = req.user!;

      // Validar acesso de microárea para ACS
      if (user.role === 'ACS') {
        const { prisma } = await import('../config/database');
        
        const patient = await prisma.patients.findUnique({
          where: { id: validatedData.patientId },
          select: { microAreaId: true }
        });

        if (!patient) {
          return res.status(404).json({ 
            error: { 
              code: 'PATIENT_NOT_FOUND', 
              message: 'Paciente não encontrado' 
            } 
          });
        }

        if (patient.microAreaId !== user.microAreaId) {
          return res.status(403).json({ 
            error: { 
              code: 'MICROAREA_ACCESS_DENIED', 
              message: 'Você não tem permissão para registrar vacinas para pacientes de outra microárea' 
            } 
          });
        }
      }
      
      const record = await vaccineService.registerVaccineApplication({
        ...validatedData,
        applicationDate: new Date(validatedData.applicationDate),
        appliedById
      });
      
      res.status(201).json(record);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /vaccines/pending/:patientId
   * Verificar vacinas pendentes
   */
  async checkPendingVaccines(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const user = req.user!;

      // Validar acesso de microárea para ACS
      if (user.role === 'ACS') {
        const { prisma } = await import('../config/database');
        
        const patient = await prisma.patients.findUnique({
          where: { id: patientId },
          select: { microAreaId: true }
        });

        if (!patient) {
          return res.status(404).json({ 
            error: { 
              code: 'PATIENT_NOT_FOUND', 
              message: 'Paciente não encontrado' 
            } 
          });
        }

        if (patient.microAreaId !== user.microAreaId) {
          return res.status(403).json({ 
            error: { 
              code: 'MICROAREA_ACCESS_DENIED', 
              message: 'Você não tem permissão para acessar pacientes de outra microárea' 
            } 
          });
        }
      }
      
      const pending = await vaccineService.checkPendingVaccines(String(patientId));
      
      res.json(pending);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * GET /vaccines/card/:patientId
   * Obter cartão de vacinação completo
   */
  async getVaccinationCard(req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const user = req.user!;

      // Validar acesso de microárea para ACS
      if (user.role === 'ACS') {
        const { prisma } = await import('../config/database');
        
        const patient = await prisma.patients.findUnique({
          where: { id: patientId },
          select: { microAreaId: true }
        });

        if (!patient) {
          return res.status(404).json({ 
            error: { 
              code: 'PATIENT_NOT_FOUND', 
              message: 'Paciente não encontrado' 
            } 
          });
        }

        if (patient.microAreaId !== user.microAreaId) {
          return res.status(403).json({ 
            error: { 
              code: 'MICROAREA_ACCESS_DENIED', 
              message: 'Você não tem permissão para acessar pacientes de outra microárea' 
            } 
          });
        }
      }
      
      const card = await vaccineService.getVaccinationCard(String(patientId));
      
      res.json(card);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}
