import { Request, Response } from 'express';
import territorializationService from '../services/territorialization.service';

export class TerritorizationController {
  // GET /territorialization/boundaries/:microAreaId
  async getMicroAreaBoundaries(req: Request, res: Response) {
    try {
      const { microAreaId } = req.params;

      const boundaries = await territorializationService.getMicroAreaBoundaries(String(microAreaId));

      if (!boundaries) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOUNDARIES_NOT_FOUND',
            message: 'Não foi possível calcular os limites da microárea',
          },
        });
      }

      return res.json({
        success: true,
        data: boundaries,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // POST /territorialization/heatmap
  async getIndicatorHeatmap(req: Request, res: Response) {
    try {
      const { microAreaId, indicator, status } = req.body;

      const heatmap = await territorializationService.getIndicatorHeatmap({
        microAreaId,
        indicator,
        status,
      });

      return res.json({
        success: true,
        data: heatmap,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // GET /territorialization/risk-areas
  async getRiskAreas(req: Request, res: Response) {
    try {
      const { microAreaId } = req.query;

      const riskAreas = await territorializationService.getRiskAreas(
        microAreaId as string | undefined
      );

      return res.json({
        success: true,
        data: {
          areas: riskAreas,
          count: riskAreas.length,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // POST /territorialization/optimize-route
  async optimizeVisitRoute(req: Request, res: Response) {
    try {
      const { acsId, date } = req.body;

      if (!acsId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ID do ACS é obrigatório',
          },
        });
      }

      const visitDate = date ? new Date(date) : new Date();

      const route = await territorializationService.optimizeVisitRoute(acsId, visitDate);

      return res.json({
        success: true,
        data: route,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // GET /territorialization/coverage
  async getTerritorialCoverage(req: Request, res: Response) {
    try {
      const { microAreaId } = req.query;

      const coverage = await territorializationService.getTerritorialCoverage(
        microAreaId as string | undefined
      );

      return res.json({
        success: true,
        data: coverage,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}

export default new TerritorizationController();
