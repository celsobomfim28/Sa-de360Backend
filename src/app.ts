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
// MIDDLEWARES DE SEGURANÇA
// ============================================

// Helmet - Headers de segurança
app.use(helmet());

// CORS
app.use(cors({
    origin: config.cors.origin,
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
// MIDDLEWARES DE PARSING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// LOGGING DE REQUISIÇÕES
// ============================================

app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
    });
});

// ============================================
// ROTAS DA API
// ============================================

app.use(`/${config.apiVersion}`, routes);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use(errorHandler);

// ============================================
// ROTA 404
// ============================================

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
