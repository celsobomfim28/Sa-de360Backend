import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './errorHandler';
// import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        cpf: string;
        fullName?: string;
        role: string;
        microAreaId?: string;
    };
}

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError(401, 'Token não fornecido', 'UNAUTHORIZED');
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AppError(401, 'Formato de token inválido', 'INVALID_TOKEN');
        }

        const token = parts[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as {
                id: string;
                cpf: string;
                fullName?: string;
                role: string;
                microAreaId?: string;
            };

            (req as AuthRequest).user = decoded;
            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AppError(401, 'Token expirado', 'TOKEN_EXPIRED');
            }
            throw new AppError(401, 'Token inválido', 'INVALID_TOKEN');
        }
    } catch (error) {
        next(error);
    }
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new AppError(401, 'Usuário não autenticado', 'UNAUTHORIZED');
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new AppError(
                    403,
                    'Você não tem permissão para acessar este recurso',
                    'FORBIDDEN'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
