import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app: Application = express();

// ============================================
// 1. HEALTH CHECK (No topo para não ser bloqueado por CORS/Rate Limit)
// ============================================

app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'saude360-backend' });
});

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
    });
});

// ============================================
// 2. MIDDLEWARES DE SEGURANÇA
// ============================================

app.use(helmet());

// CORS corrigido para aceitar requisições sem 'Origin' (Health checks, Postman, Curl)
const isAllowedOrigin = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
) => {
    // Permite requisições sem 'origin' (Health checks do Render, Server-to-Server, ferramentas CLI)
    if (!origin) {
        return callback(null, true);
    }

    // Origem listada explicitamente em CORS_ORIGIN
    if (config.cors.origin.includes(origin)) {
        return callback(null, true);
    }

    // Subdomínios vercel.app
    const vercelAppHostname = 'vercel.app';
    try {
        const hostname = new URL(origin).hostname;
        if (hostname === vercelAppHostname || hostname.endsWith(`.${vercelAppHostname}`)) {
            return callback(null, true);
        }
    } catch {
        // falha ao analisar URL
    }

    return callback(new Error('Bloqueado por CORS'), false);
};

app.use(cors({
    origin: isAllowedOrigin,
    credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// ============================================
// 3. MIDDLEWARES DE PARSING & LOGGING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// ============================================
// 4. ROTAS DA API & TRATAMENTO DE ERROS
// ============================================

app.use(`/${config.apiVersion}`, routes);

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'Rota não encontrada',
            path: req.path,
        },
    });
});

export default app;