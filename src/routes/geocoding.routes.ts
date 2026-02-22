import { Router } from 'express';
import geocodingController from '../controllers/geocoding.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Geocodificar um paciente específico
router.post('/patient/:patientId', geocodingController.geocodePatient);

// Geocodificar em lote
router.post('/batch', geocodingController.geocodeBatch);

// Resetar geocodificação (limpar coordenadas)
router.post('/reset', geocodingController.resetGeocoding);

// Obter estatísticas de geocodificação
router.get('/stats', geocodingController.getStats);

export default router;
