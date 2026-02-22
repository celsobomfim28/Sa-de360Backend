import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class HypertensionService {
    async createConsultation(data: any) {
        const {
            patientId,
            professionalId,
            consultationDate,
            systolicBP,
            diastolicBP,
            weight,
            height,
            medicationAdherence,
            observations
        } = data;

        // 1. Create the consultation record
        let imc: number | null = null;
        if (weight && height) {
            imc = weight / ((height / 100) * (height / 100));
        }

        const consultation = await prisma.hypertension_consultations.create({
            data: {
                id: require('crypto').randomUUID(),
                patientId,
                professionalId,
                consultationDate: new Date(consultationDate),
                systolicBP,
                diastolicBP,
                weight,
                height,
                imc,
                medicationAdherence,
                observations,
                updatedAt: new Date(),
            }
        });

        // 2. Update the Hypertension Indicator (E1, E2, E3)
        // E1: Consultation in last 6 months
        // E2: BP recorded in last 6 months
        // E3: Weight/Height recorded in last 12 months

        const updateData: any = {
            lastConsultationDate: new Date(consultationDate),
            lastBloodPressureDate: new Date(consultationDate),
            lastAnthropometryDate: weight && height ? new Date(consultationDate) : undefined,
            e1Status: 'GREEN', // Consulta nos últimos 6 meses
            e2Status: 'GREEN', // PA nos últimos 6 meses
            e3Status: weight && height ? 'GREEN' : undefined, // Antropometria nos últimos 12 meses
            lastUpdated: new Date()
        };

        console.log('[HypertensionService] ✅ Consulta registrada - Indicador E1 atualizado');
        console.log('[HypertensionService] ✅ PA registrada - Indicador E2 atualizado');
        if (weight && height) {
            console.log('[HypertensionService] ✅ Antropometria registrada - Indicador E3 atualizado');
        }

        await prisma.hypertension_indicators.upsert({
            where: { patientId },
            update: updateData,
            create: {
                id: require('crypto').randomUUID(),
                patientId,
                lastConsultationDate: new Date(consultationDate),
                lastBloodPressureDate: new Date(consultationDate),
                lastAnthropometryDate: weight && height ? new Date(consultationDate) : null,
                e1Status: 'GREEN',
                e2Status: 'GREEN',
                e3Status: weight && height ? 'GREEN' : 'RED',
                e4Status: 'RED', // Será atualizado quando visitas forem registradas
                visitCountLast12Months: 0,
                lastUpdated: new Date()
            }
        });

        return consultation;
    }

    async getHistory(patientId: string) {
        return await prisma.hypertension_consultations.findMany({
            where: { patientId },
            orderBy: { consultationDate: 'desc' },
            include: {
                users: {
                    select: { fullName: true, role: true }
                }
            }
        });
    }

    async updateIndicators(patientId: string) {
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            include: {
                hypertension_indicators: true,
                home_visits: {
                    where: {
                        visitDate: {
                            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
                hypertension_consultations: {
                    orderBy: { consultationDate: 'desc' },
                    take: 1,
                },
            },
        });

        if (!patient || !patient.hasHypertension) return;

        const now = new Date();
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        const lastConsultation = patient.hypertension_consultations?.[0]?.consultationDate;

        const updates: any = {
            e1Status: lastConsultation && lastConsultation >= sixMonthsAgo ? 'GREEN' : 'RED',
            e4Status: (patient.home_visits?.length || 0) >= 2 ? 'GREEN' : (patient.home_visits?.length || 0) === 1 ? 'YELLOW' : 'RED',
            visitCountLast12Months: patient.home_visits?.length || 0,
            lastUpdated: now,
        };

        if (patient.hypertension_indicators) {
            await prisma.hypertension_indicators.update({
                where: { patientId },
                data: updates,
            });
        } else {
            await prisma.hypertension_indicators.create({
                data: {
                    id: require('crypto').randomUUID(),
                    patientId,
                    e1Status: updates.e1Status,
                    e2Status: 'RED',
                    e3Status: 'RED',
                    e4Status: updates.e4Status,
                    visitCountLast12Months: updates.visitCountLast12Months,
                    lastUpdated: now,
                },
            });
        }
    }
}





