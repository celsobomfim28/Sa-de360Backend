import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton do Prisma Client
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ],
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma: any = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

// Log de queries em desenvolvimento
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: any) => {
        logger.debug('Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
        });
    });
}

// Teste de conexão (não rodar durante testes)
if (process.env.NODE_ENV !== 'test') {
    prisma.$connect()
        .then(() => {
            logger.info('✅ Conectado ao banco de dados PostgreSQL');
        })
        .catch((error: unknown) => {
            logger.error('❌ Erro ao conectar ao banco de dados:', error);
            process.exit(1);
        });
}
