import { randomUUID } from 'crypto';
import { prisma } from '../config/database';

type SyncUploadOperation = {
    id: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: 'HOME_VISIT' | string;
    data: any;
    timestamp: number;
};

export class SyncService {
    async upload(userId: string, payload: {
        deviceId: string;
        lastSyncAt?: string;
        operations: SyncUploadOperation[];
    }) {
        const results: Array<{
            localId: string;
            status: 'SUCCESS' | 'ERROR';
            serverId?: string;
            message: string;
        }> = [];

        for (const op of payload.operations || []) {
            try {
                if (op.entity === 'HOME_VISIT' && op.operation === 'CREATE') {
                    const d = op.data || {};
                    const created = await prisma.home_visits.create({
                        data: {
                            id: randomUUID(),
                            patientId: d.patientId,
                            acsId: userId,
                            visitDate: d.visitDate ? new Date(d.visitDate) : new Date(),
                            visitType: d.visitType,
                            purpose: d.purpose || 'Sincronização mobile',
                            observations: d.observations,
                            latitude: d.latitude,
                            longitude: d.longitude,
                            updatedAt: new Date(),
                        },
                    });

                    results.push({
                        localId: op.id,
                        status: 'SUCCESS',
                        serverId: created.id,
                        message: 'Visita domiciliar registrada com sucesso',
                    });
                    continue;
                }

                results.push({
                    localId: op.id,
                    status: 'ERROR',
                    message: `Operação não suportada: ${op.operation} ${op.entity}`,
                });
            } catch (error: any) {
                results.push({
                    localId: op.id,
                    status: 'ERROR',
                    message: error?.message || 'Erro ao processar operação',
                });
            }
        }

        return {
            syncId: randomUUID(),
            processedAt: new Date().toISOString(),
            results,
            conflicts: [],
        };
    }

    async download(lastSyncAt?: string) {
        const since = lastSyncAt ? new Date(Number(lastSyncAt)) : new Date(0);

        const updatedPatients = await prisma.patients.findMany({
            where: {
                updatedAt: { gt: since },
                deletedAt: null,
            },
            select: {
                id: true,
                fullName: true,
                updatedAt: true,
            },
            orderBy: { updatedAt: 'asc' },
            take: 200,
        });

        const updates = updatedPatients.map((p) => ({
            entity: 'PATIENT',
            operation: 'UPDATE',
            id: p.id,
            data: {
                id: p.id,
                fullName: p.fullName,
                updatedAt: p.updatedAt.toISOString(),
            },
        }));

        return {
            syncId: randomUUID(),
            serverTime: new Date().toISOString(),
            updates,
        };
    }
}
