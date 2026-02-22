import { HypertensionService } from '../services/hypertension.service';
import { prisma } from '../config/database';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../config/database', () => ({
    __esModule: true,
    prisma: {
        patients: { findUnique: jest.fn() },
        hypertension_indicators: { create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
        hypertension_consultations: { create: jest.fn(), findMany: jest.fn() }
    }
}));

const prismaMock = prisma as any;

describe('HypertensionService', () => {
    let service: HypertensionService;

    beforeEach(() => {
        service = new HypertensionService();
        jest.clearAllMocks();
    });

    describe('updateIndicators', () => {
        const patientId = 'p1';
        const indicatorId = 'ind1';

        it('should mark E1 as GREEN if last consultation is recent', async () => {
            const recentDate = new Date();

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasHypertension: true,
                hypertension_consultations: [{ consultationDate: recentDate }],
                home_visits: Array(4).fill({}),
                hypertension_indicators: { id: indicatorId }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.hypertension_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({ e1Status: 'GREEN' })
            });
        });

        it('should mark E4 as RED if less than 4 home visits exist in the last year', async () => {
            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasHypertension: true,
                hypertension_consultations: [],
                home_visits: Array(0).fill({}),
                hypertension_indicators: { id: indicatorId }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.hypertension_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({ e4Status: 'RED' })
            });
        });
    });
});
