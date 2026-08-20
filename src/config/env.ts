import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',

    database: {
        url: process.env.DATABASE_URL || '',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
    },

    cors: {
        origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(url => url.trim()),
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },

    notifications: {
        autoRunEnabled: process.env.NOTIFICATIONS_AUTO_RUN_ENABLED !== 'false',
        intervalMs: parseInt(process.env.NOTIFICATIONS_INTERVAL_MS || '900000', 10), // 15 min
        startupDelayMs: parseInt(process.env.NOTIFICATIONS_STARTUP_DELAY_MS || '15000', 10), // 15s
    },
} as const;

// Validação de variáveis obrigatórias (não rodar em teste se possível, ou garantir mock)
if (process.env.NODE_ENV !== 'test') {
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Variável de ambiente obrigatória não definida: ${envVar}`);
        }
    }
}
