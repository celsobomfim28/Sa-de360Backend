import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticate);

/**
 * GET /notifications
 * Listar notificações do usuário
 * Query params: unreadOnly (boolean)
 */
router.get(
  '/',
  asyncHandler(notificationController.listUserNotifications)
);

/**
 * PUT /notifications/:notificationId/read
 * Marcar notificação como lida
 */
router.put(
  '/:notificationId/read',
  asyncHandler(notificationController.markAsRead)
);

/**
 * PUT /notifications/read-all
 * Marcar todas as notificações como lidas
 */
router.put(
  '/read-all',
  asyncHandler(notificationController.markAllAsRead)
);

/**
 * POST /notifications/automatic
 * Executar envio de notificações automáticas (cron job)
 * Acesso: ADMIN apenas
 */
router.post(
  '/automatic',
  authorize('ADMIN'),
  asyncHandler(notificationController.sendAutomaticNotifications)
);

/**
 * POST /notifications/appointment/:appointmentId/reminder
 * Enviar lembrete de consulta específica
 */
router.post(
  '/appointment/:appointmentId/reminder',
  asyncHandler(notificationController.sendAppointmentReminder)
);

/**
 * POST /notifications/exam/:examId/result
 * Notificar resultado de exame disponível
 */
router.post(
  '/exam/:examId/result',
  asyncHandler(notificationController.notifyExamResult)
);

export default router;
