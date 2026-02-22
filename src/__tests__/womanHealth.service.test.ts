import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WomanHealthService } from '../services/womanHealth.service';
import { prisma } from '../config/database';

jest.mock('../config/database', () => ({
    __esModule: true,
    prisma: {
        patients: { findUnique: jest.fn(), findMany: jest.fn() },
        woman_health_indicators: { create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
        woman_exams: { create: jest.fn() }
    }
}));

const prismaMock = prisma as any;

describe('WomanHealthService', () => {
    let service: WomanHealthService;

    beforeEach(() => {
        service = new WomanHealthService();
        jest.clearAllMocks();
    });

    describe('updateIndicators', () => {
        const patientId = 'p1';
        const indicatorId = 'ind1';

        it('should mark G1 as GREEN if Pap smear was done within 3 years', async () => {
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - 30);

            const examDate = new Date();
            examDate.setFullYear(examDate.getFullYear() - 1);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                birthDate,
                isWoman: true,
                woman_exams: [{ type: 'PAP_SMEAR', examDate }],
                woman_health_indicators: { id: indicatorId }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.woman_health_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    g1Status: 'GREEN'
                })
            });
        });

        it('should mark G1 as RED if Pap smear is older than 3 years', async () => {
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - 30);

            const examDate = new Date();
            examDate.setFullYear(examDate.getFullYear() - 4);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                birthDate,
                isWoman: true,
                woman_exams: [{ type: 'PAP_SMEAR', examDate }],
                woman_health_indicators: { id: indicatorId }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.woman_health_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    g1Status: 'RED'
                })
            });
        });

        it('should mark G2 as GREEN if Mammography was done within 2 years (Ages 50-69)', async () => {
            const birthDate = new Date();
            birthDate.setFullYear(birthDate.getFullYear() - 55);

            const examDate = new Date();
            examDate.setFullYear(examDate.getFullYear() - 1);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                birthDate,
                isWoman: true,
                woman_exams: [{ type: 'MAMMOGRAPHY', examDate }],
                woman_health_indicators: { id: indicatorId }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.woman_health_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    g2Status: 'GREEN'
                })
            });
        });
    });
});
