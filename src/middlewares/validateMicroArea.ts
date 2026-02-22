import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';

/**
 * Middleware para validar se o ACS tem acesso ao paciente da sua microárea
 * Outros perfis têm acesso a todos os pacientes
 */
export const validateMicroAreaAccess = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        console.log('[MicroArea] Validando acesso - Usuário:', req.user?.fullName, 'Role:', req.user?.role);
        
        // Se não for ACS, permite acesso
        if (req.user?.role !== 'ACS') {
            console.log('[MicroArea] Usuário não é ACS, acesso permitido');
            return next();
        }

        // ACS deve ter microAreaId
        if (!req.user.microAreaId) {
            console.error('[MicroArea] ACS sem microárea atribuída');
            throw new AppError(
                403,
                'ACS sem microárea atribuída',
                'NO_MICROAREA_ASSIGNED'
            );
        }

        console.log('[MicroArea] ACS MicroAreaId:', req.user.microAreaId);

        // Buscar patientId dos parâmetros ou body
        const patientId = req.params.id || req.params.patientId || req.body.patientId;

        if (!patientId) {
            // Se não há patientId, pode ser uma listagem - será filtrada no serviço
            console.log('[MicroArea] Sem patientId, permitindo (será filtrado no serviço)');
            return next();
        }

        console.log('[MicroArea] Verificando acesso ao paciente:', patientId);

        // Verificar se o paciente pertence à microárea do ACS
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            select: { 
                microAreaId: true,
                fullName: true,
            },
        });

        if (!patient) {
            console.error('[MicroArea] Paciente não encontrado:', patientId);
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        console.log('[MicroArea] Paciente:', patient.fullName, 'MicroAreaId:', patient.microAreaId);

        if (patient.microAreaId !== req.user.microAreaId) {
            console.error('[MicroArea] ACESSO NEGADO - ACS microárea:', req.user.microAreaId, 'Paciente microárea:', patient.microAreaId);
            throw new AppError(
                403,
                'Você não tem permissão para acessar pacientes de outra microárea',
                'MICROAREA_ACCESS_DENIED'
            );
        }

        console.log('[MicroArea] Acesso permitido');
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware para filtrar listagens por microárea do ACS
 */
export const filterByMicroArea = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        // Se for ACS, força o filtro pela sua microárea
        if (req.user?.role === 'ACS' && req.user.microAreaId) {
            // Adiciona microAreaId aos query params
            req.query.microAreaId = req.user.microAreaId;
        }

        next();
    } catch (error) {
        next(error);
    }
};



