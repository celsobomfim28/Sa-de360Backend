import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middlewares/errorHandler';
// import { LoginInput } from '../validators/auth.validator';

export class AuthService {
    async login(cpf: string, password: string) {
        // Remover formatação do CPF
        const cleanCpf = cpf.replace(/\D/g, '');

        // Buscar usuário
        const user = await prisma.users.findUnique({
            where: { cpf: cleanCpf },
            include: {
                micro_areas: true,
            },
        });

        if (!user || !user.isActive) {
            throw new AppError(401, 'CPF ou senha inválidos', 'INVALID_CREDENTIALS');
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError(401, 'CPF ou senha inválidos', 'INVALID_CREDENTIALS');
        }

        // Gerar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                cpf: user.cpf,
                role: user.role,
                microAreaId: user.microAreaId,
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn as any }
        );

        return {
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                cpf: user.cpf,
                role: user.role,
                microArea: user.micro_areas
                    ? {
                        id: user.micro_areas.id,
                        name: user.micro_areas.name,
                    }
                    : null,
            },
            expiresIn: 86400, // 24 horas em segundos
        };
    }

    async refreshToken(oldToken: string) {
        try {
            const decoded = jwt.verify(oldToken, config.jwt.secret) as {
                id: string;
                cpf: string;
                role: string;
                microAreaId?: string;
            };

            // Gerar novo token
            const newToken = jwt.sign(
                {
                    id: decoded.id,
                    cpf: decoded.cpf,
                    role: decoded.role,
                    microAreaId: decoded.microAreaId,
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn as any }
            );

            return {
                token: newToken,
                expiresIn: 86400,
            };
        } catch (error) {
            throw new AppError(401, 'Token inválido ou expirado', 'INVALID_TOKEN');
        }
    }
}
