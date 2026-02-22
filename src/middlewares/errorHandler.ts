import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
// import { Prisma } from '@prisma/client';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error('Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Erro customizado da aplicação
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code || 'APP_ERROR',
                message: err.message,
                details: err.details,
            },
        });
    }

    // Erro de validação do Zod
    if (err instanceof ZodError) {
        return res.status(422).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Dados inválidos',
                details: err.issues.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
        });
    }


    // Erros do Prisma
    // if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;
        // Violação de constraint única
        if (prismaError.code === 'P2002') {
            const field = (prismaError.meta?.target as string[])?.join(', ') || 'campo';
            return res.status(409).json({
                error: {
                    code: 'UNIQUE_CONSTRAINT_VIOLATION',
                    message: `${field} já cadastrado no sistema`,
                    details: { field },
                },
            });
        }

        // Registro não encontrado
        if (prismaError.code === 'P2025') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Registro não encontrado',
                },
            });
        }

        // Violação de foreign key
        if (prismaError.code === 'P2003') {
            const field = prismaError.meta?.field_name || 'referência';
            return res.status(400).json({
                error: {
                    code: 'FOREIGN_KEY_VIOLATION',
                    message: `Referência inválida: ${field}`,
                    details: { field, meta: prismaError.meta },
                },
            });
        }
    }

    // Erro de validação do Prisma
    // if (err instanceof Prisma.PrismaClientValidationError) {
    if (err.name === 'PrismaClientValidationError') {
        console.error('[ErrorHandler] Prisma Validation Error:', err.message);
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Dados inválidos',
                ...(process.env.NODE_ENV === 'development' && {
                    details: err.message,
                }),
            },
        });
    }

    // Erro genérico
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor',
            ...(process.env.NODE_ENV === 'development' && {
                details: err.message,
                stack: err.stack,
            }),
        },
    });
};

// Wrapper para funções assíncronas
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
