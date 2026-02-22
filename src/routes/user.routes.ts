import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const userController = new UserController();

// All user management routes require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', userController.list);
router.post('/', userController.create);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export default router;
