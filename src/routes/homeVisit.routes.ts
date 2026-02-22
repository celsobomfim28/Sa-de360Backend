import { Router } from 'express';
import { HomeVisitController } from '../controllers/homeVisit.controller';
import { authenticate } from '../middlewares/auth';
import { validateMicroAreaAccess, filterByMicroArea } from '../middlewares/validateMicroArea';

const router = Router();
const homeVisitController = new HomeVisitController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// CRUD de visitas domiciliares
// ACS só pode criar visitas para pacientes da sua microárea
router.post('/', validateMicroAreaAccess, homeVisitController.create);

// ACS vê apenas visitas da sua microárea
router.get('/', filterByMicroArea, homeVisitController.list);

// ACS só acessa visitas de pacientes da sua microárea
router.get('/:id', validateMicroAreaAccess, homeVisitController.getById);

// ACS só atualiza visitas de pacientes da sua microárea
router.put('/:id', validateMicroAreaAccess, homeVisitController.update);

// Visitas pendentes do ACS (já filtrado por ACS)
router.get('/acs/:acsId/pending', homeVisitController.getPendingVisits);

export default router;
