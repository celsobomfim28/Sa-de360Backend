import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ElderlyService } from '../services/elderly.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
    __esModule: true,
    prisma: {
        patients: { findUnique: jest.fn(), findMany: jest.fn() },
        elderly_indicators: { create: jest.fn(), update: jest.fn() },
        elderly_consultations: { create: jest.fn() }
    }
}));

const prismaMock = prisma as any;

describe('ElderlyService', () => {
    let service: ElderlyService;

    beforeEach(() => {
        service = new ElderlyService();
        jest.clearAllMocks();
    });

    describe('updateIndicators', () => {
        const patientId = 'p1';
        const indicatorId = 'ind1';

        it('should mark F1 and F2 as RED if no consultation exists in the last 12 months', async () => {
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - 70);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                birthDate,
                isElderly: true,
                elderly_consultations: [],
                elderly_indicators: { id: indicatorId },
                anthropometry: [],
                vaccine_records: []
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.elderly_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    f1Status: 'RED',
                    f2Status: 'RED'
                })
            });
        });

        it('should mark F1 as GREEN if medications <= 5', async () => {
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - 70);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                birthDate,
                isElderly: true,
                elderly_consultations: [{
                    medicationsCount: 3,
                    ivcfScore: 2,
                    consultationDate: new Date()
                }],
                elderly_indicators: { id: indicatorId },
                anthropometry: [],
                vaccine_records: []
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.elderly_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    f1Status: 'GREEN'
                })
            });
        });
    });
});
