import { DiabetesService } from '../services/diabetes.service';
import { prisma } from '../config/database';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../config/database', () => ({
    __esModule: true,
    prisma: {
        patients: { findUnique: jest.fn() },
        diabetes_indicators: { create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
        diabetes_consultations: { create: jest.fn(), findMany: jest.fn() }
    }
}));

const prismaMock = prisma as any;

describe('DiabetesService', () => {
    let service: DiabetesService;

    beforeEach(() => {
        service = new DiabetesService();
        jest.clearAllMocks();
    });

    describe('updateIndicators', () => {
        const patientId = 'p1';

        it('should evaluate D2 and D4 when updating indicators', async () => {
            const oldDate = new Date();
            oldDate.setMonth(oldDate.getMonth() - 7);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasDiabetes: true,
                home_visits: Array(2).fill({}),
                diabetes_indicators: { lastBloodPressureDate: oldDate }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.diabetes_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({ d2Status: 'RED', d4Status: 'GREEN' })
            });
        });

        it('should mark D4 as GREEN if at least 4 home visits exist in the last year', async () => {
            const patientId = 'test-patient-id';

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasDiabetes: true,
                home_visits: [
                    { id: 'v1', visitDate: new Date() },
                    { id: 'v2', visitDate: new Date() },
                    { id: 'v3', visitDate: new Date() }
                ],
                diabetes_indicators: { lastBloodPressureDate: new Date() }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.diabetes_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    d4Status: 'GREEN'
                })
            });
        });

        it('should mark D4 as YELLOW if one home visit exists in the last year', async () => {
            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasDiabetes: true,
                home_visits: [{ id: 'v1' }], // Only 1 visit
                diabetes_indicators: { lastBloodPressureDate: new Date() }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.diabetes_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({ d4Status: 'YELLOW' })
            });
        });

        it('should correctly evaluate D2 (BP) based on lastBloodPressureDate', async () => {
            const oldDate = new Date();
            oldDate.setMonth(oldDate.getMonth() - 8);

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasDiabetes: true,
                home_visits: [],
                diabetes_indicators: {
                    lastBloodPressureDate: oldDate // > 6 months
                }
            });

            await service.updateIndicators(patientId);

            expect(prismaMock.diabetes_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({ d2Status: 'RED' })
            });
        });
    });

    describe('registerAssessment', () => {
        it('should update indicators for FOOT_EXAM', async () => {
            const patientId = 'p1';
            const date = new Date();

            prismaMock.patients.findUnique.mockResolvedValue({
                id: patientId,
                hasDiabetes: true,
                diabetes_indicators: { id: 'ind1' }
            });

            await service.registerAssessment(patientId, {
                type: 'FOOT_EXAM',
                date
            });

            expect(prismaMock.diabetes_indicators.update).toHaveBeenCalledWith({
                where: { patientId },
                data: expect.objectContaining({
                    lastFootExamDate: date,
                    d6Status: 'GREEN'
                })
            });
        });
    });
});
