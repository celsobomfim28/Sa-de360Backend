import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { z } from 'zod';

const dashboardService = new DashboardService();

// Validações
const statsByPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  microAreaId: z.string().uuid().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
});

const indicatorEvolutionSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  microAreaId: z.string().uuid().optional(),
  indicator: z.enum(['prenatal', 'childcare', 'diabetes', 'hypertension', 'elderly', 'woman']),
});

const comparePeriodsSchema = z.object({
  period1Start: z.string().datetime(),
  period1End: z.string().datetime(),
  period2Start: z.string().datetime(),
  period2End: z.string().datetime(),
  microAreaId: z.string().uuid().optional(),
});

export class DashboardController {
  /**
   * POST /dashboard/stats-by-period
   * Obter estatísticas por período
   */
  async getStatsByPeriod(req: Request, res: Response) {
    try {
      const validatedData = statsByPeriodSchema.parse(req.body);

      const stats = await dashboardService.getStatsByPeriod({
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        microAreaId: validatedData.microAreaId,
        period: validatedData.period,
      });

      res.json(stats);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /dashboard/indicator-evolution
   * Obter evolução de indicadores
   */
  async getIndicatorEvolution(req: Request, res: Response) {
    try {
      const validatedData = indicatorEvolutionSchema.parse(req.body);

      const evolution = await dashboardService.getIndicatorEvolution({
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        microAreaId: validatedData.microAreaId,
        indicator: validatedData.indicator,
      });

      res.json(evolution);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /dashboard/compare-periods
   * Comparar dois períodos
   */
  async comparePeriods(req: Request, res: Response) {
    try {
      const validatedData = comparePeriodsSchema.parse(req.body);

      const comparison = await dashboardService.comparePeriods({
        period1Start: new Date(validatedData.period1Start),
        period1End: new Date(validatedData.period1End),
        period2Start: new Date(validatedData.period2Start),
        period2End: new Date(validatedData.period2End),
        microAreaId: validatedData.microAreaId,
      });

      res.json(comparison);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }
}
