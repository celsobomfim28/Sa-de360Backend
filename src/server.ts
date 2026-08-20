import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { NotificationService } from './services/notification.service';

const PORT = config.port;
const notificationService = new NotificationService();
let notificationInterval: NodeJS.Timeout | null = null;
let notificationStartupTimeout: NodeJS.Timeout | null = null;
let notificationJobRunning = false;

const runAutomaticNotificationsJob = async () => {
    if (notificationJobRunning) {
        logger.warn('⏭️ Job de notificações já está em execução. Ignorando novo disparo.');
        return;
    }

    notificationJobRunning = true;

    try {
        const result = await notificationService.sendAutomaticNotifications();
        logger.info('📣 Job de notificações finalizado', result);
    } catch (error) {
        logger.error('❌ Erro no job automático de notificações', error);
    } finally {
        notificationJobRunning = false;
    }
};

const startNotificationScheduler = () => {
    if (!config.notifications.autoRunEnabled) {
        logger.info('🔕 Agendador automático de notificações desabilitado por configuração');
        return;
    }

    logger.info('⏱️ Agendador de notificações iniciado', {
        startupDelayMs: config.notifications.startupDelayMs,
        intervalMs: config.notifications.intervalMs,
    });

    notificationStartupTimeout = setTimeout(() => {
        void runAutomaticNotificationsJob();
    }, config.notifications.startupDelayMs);

    notificationInterval = setInterval(() => {
        void runAutomaticNotificationsJob();
    }, config.notifications.intervalMs);
};

const stopNotificationScheduler = () => {
    if (notificationStartupTimeout) {
        clearTimeout(notificationStartupTimeout);
        notificationStartupTimeout = null;
    }

    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
};

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const server = app.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📝 Ambiente: ${config.env}`);
    logger.info(`🔗 API: http://localhost:${PORT}/${config.apiVersion}`);
    logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    startNotificationScheduler();
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} recebido. Encerrando servidor gracefully...`);

    server.close(async () => {
        logger.info('Servidor HTTP fechado');
        stopNotificationScheduler();

        // Desconectar do banco de dados
        await prisma.$disconnect();
        logger.info('Conexão com banco de dados encerrada');

        process.exit(0);
    });

    // Forçar encerramento após 10 segundos
    setTimeout(() => {
        logger.error('Forçando encerramento após timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// TRATAMENTO DE ERROS NÃO CAPTURADOS
// ============================================

process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default server;
