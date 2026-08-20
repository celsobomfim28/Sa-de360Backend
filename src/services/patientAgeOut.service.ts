import { prisma } from '../config/database';

export class PatientAgeOutService {
    async runAgeOut() {
        const now = new Date();

        // Crianças que completaram 2 anos (puericultura vai até 24 meses)
        const childCutoff = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        const childFloor = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

        const childResult = await prisma.patients.updateMany({
            where: {
                deletedAt: null,
                birthDate: {
                    lte: childCutoff,
                    gt: childFloor,
                },
                OR: [
                    { isChild: true },
                    { childcare_indicators: { is: {} } },
                ],
            },
            data: { deletedAt: now },
        });

        return {
            agedOut: childResult.count,
            childrenAgedOut: childResult.count,
        };
    }
}