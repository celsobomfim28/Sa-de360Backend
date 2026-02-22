import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  /**
   * Listar notificações do usuário
   */
  async listUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unreadOnly === 'true';

      const data = await notificationService.getUserNotifications(userId, unreadOnly);

      return res.json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.params;
      const userId = req.user!.id;

      await notificationService.markAsRead(String(notificationId), userId);

      return res.json({
        success: true,
        message: 'Notificação marcada como lida',
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      await notificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        message: 'Todas as notificações marcadas como lidas',
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Executar envio de notificações automáticas (cron job)
   */
  async sendAutomaticNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.sendAutomaticNotifications();

      return res.json({
        success: true,
        message: 'Notificações automáticas enviadas com sucesso',
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Enviar lembrete de consulta específica
   */
  async sendAppointmentReminder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;

      await notificationService.sendAppointmentReminder(String(appointmentId));

      return res.json({
        success: true,
        message: 'Lembrete de consulta enviado',
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Notificar resultado de exame disponível
   */
  async notifyExamResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { examId } = req.params;

      await notificationService.notifyExamResultReady(String(examId));

      return res.json({
        success: true,
        message: 'Notificação de resultado de exame enviada',
      });
    } catch (error) {
      return next(error);
    }
  }
}
