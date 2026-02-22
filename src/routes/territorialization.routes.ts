import { Router } from 'express';
import territorializationController from '../controllers/territorialization.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /territorialization/boundaries/:microAreaId - Obter limites da microárea
router.get(
  '/boundaries/:microAreaId',
  territorializationController.getMicroAreaBoundaries
);

// POST /territorialization/heatmap - Obter mapa de calor de indicadores
router.post(
  '/heatmap',
  territorializationController.getIndicatorHeatmap
);

// GET /territorialization/risk-areas - Identificar áreas de risco
router.get(
  '/risk-areas',
  territorializationController.getRiskAreas
);

// POST /territorialization/optimize-route - Otimizar rota de visitas
router.post(
  '/optimize-route',
  territorializationController.optimizeVisitRoute
);

// GET /territorialization/coverage - Estatísticas de cobertura territorial
router.get(
  '/coverage',
  territorializationController.getTerritorialCoverage
);

export default router;
