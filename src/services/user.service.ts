import bcrypt from 'bcrypt';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class UserService {
    async listUsers() {
        return await prisma.users.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                cpf: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
                microAreaId: true,
                micro_areas: {
                    select: {
                        name: true
                    }
                },
                createdAt: true
            },
            orderBy: { fullName: 'asc' }
        });
    }

    async getUserById(id: string) {
        const user = await prisma.users.findUnique({
            where: { id },
            include: { micro_areas: true }
        });

        if (!user || user.deletedAt) {
            throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
        }

        return user;
    }

    async updateUser(id: string, data: any) {
        const user = await prisma.users.findUnique({ where: { id } });

        if (!user || user.deletedAt) {
            throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
        }

        const updateData: any = {
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            isActive: data.isActive,
            microAreaId: data.microAreaId === '' ? null : data.microAreaId
        };

        // If password is provided, hash it
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 12);
        }

        // Clean undefined values
        Object.keys(updateData).forEach(key =>
            updateData[key] === undefined && delete updateData[key]
        );

        return await prisma.users.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                cpf: true,
                email: true,
                role: true,
                isActive: true
            }
        });
    }

    async createUser(data: any) {
        // Enforce CPF uniqueness
        const existingUser = await prisma.users.findFirst({
            where: {
                cpf: data.cpf,
                deletedAt: null
            }
        });

        if (existingUser) {
            throw new AppError(400, 'CPF já cadastrado no sistema', 'CPF_ALREADY_EXISTS');
        }

        // Hash password (default password if not provided)
        const hashedPassword = await bcrypt.hash(data.password || 'senha123', 12);

        return await prisma.users.create({
            data: {
                cpf: data.cpf,
                fullName: data.fullName,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                microAreaId: data.microAreaId === '' ? null : data.microAreaId,
                isActive: true
            },
            select: {
                id: true,
                fullName: true,
                cpf: true,
                email: true,
                role: true,
                isActive: true
            }
        });
    }

    async deleteUser(id: string) {
        const user = await prisma.users.findUnique({ where: { id } });

        if (!user || user.deletedAt) {
            throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
        }

        // Soft delete
        return await prisma.users.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            }
        });
    }
}
