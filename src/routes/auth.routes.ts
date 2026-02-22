import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /auth/login
 * @desc    Autentica um usuário
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @route   POST /auth/refresh
 * @desc    Renova o token JWT
 * @access  Public
 */
router.post('/refresh', asyncHandler(authController.refresh));

/**
 * @route   POST /auth/logout
 * @desc    Invalida o token atual
 * @access  Private
 */
router.post('/logout', asyncHandler(authController.logout));

export default router;
