import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { NotificationService } from './services/notification.service';
import { PatientAgeOutService } from './services/patientAgeOut.service';

// Garante fallback direto para process.env.PORT se config.port falhar
const PORT = process.env.PORT ? Number(process.env.PORT) : (config.port || 10000);

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
    if (!config.notifications?.autoRunEnabled) {
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

const patientAgeOutService = new PatientAgeOutService();
let patientAgeOutInterval: NodeJS.Timeout | null = null;
let patientAgeOutStartupTimeout: NodeJS.Timeout | null = null;
let patientAgeOutJobRunning = false;

const runPatientAgeOutJob = async () => {
    if (patientAgeOutJobRunning) {
        logger.warn('⏭️ Job de saída por idade já está em execução. Ignorando novo disparo.');
        return;
    }

    patientAgeOutJobRunning = true;

    try {
        const result = await patientAgeOutService.runAgeOut();
        logger.info('👶🧓 Job de saída por idade finalizado', result);
    } catch (error) {
        logger.error('❌ Erro no job automático de saída por idade', error);
    } finally {
        patientAgeOutJobRunning = false;
    }
};

const startPatientAgeOutScheduler = () => {
    if (!config.patientAgeOut?.autoRunEnabled) {
        logger.info('🚫 Agendador de saída por idade desabilitado por configuração');
        return;
    }

    logger.info('⏱️ Agendador de saída por idade iniciado', {
        startupDelayMs: config.patientAgeOut.startupDelayMs,
        intervalMs: config.patientAgeOut.intervalMs,
    });

    patientAgeOutStartupTimeout = setTimeout(() => {
        void runPatientAgeOutJob();
    }, config.patientAgeOut.startupDelayMs);

    patientAgeOutInterval = setInterval(() => {
        void runPatientAgeOutJob();
    }, config.patientAgeOut.intervalMs);
};

const stopPatientAgeOutScheduler = () => {
    if (patientAgeOutStartupTimeout) {
        clearTimeout(patientAgeOutStartupTimeout);
        patientAgeOutStartupTimeout = null;
    }

    if (patientAgeOutInterval) {
        clearInterval(patientAgeOutInterval);
        patientAgeOutInterval = null;
    }
};

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📝 Ambiente: ${config.env}`);
    logger.info(`🔗 API: http://0.0.0.0:${PORT}/${config.apiVersion}`);
    logger.info(`💚 Health Check: http://0.0.0.0:${PORT}/health`);
    startNotificationScheduler();
    startPatientAgeOutScheduler();
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} recebido. Encerrando servidor gracefully...`);

    server.close(async () => {
        logger.info('Servidor HTTP fechado');
        stopNotificationScheduler();
        stopPatientAgeOutScheduler();

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
// TRATAMENTO DE ERROS NÃO CAPTURADOS (Sem derrubar a aplicação)
// ============================================

process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection capturado (sem desligar servidor):', reason);
});

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception capturado:', error);
});

export default server;