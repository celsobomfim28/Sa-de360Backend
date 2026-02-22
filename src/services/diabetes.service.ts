import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class DiabetesService {
    async createConsultation(data: any) {
        const {
            patientId,
            professionalId,
            consultationDate,
            glucose,
            glucoseType,
            hba1c,
            footExamPerformed,
            footExamResult,
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

        const consultation = await prisma.diabetes_consultations.create({
            data: {
                id: require('crypto').randomUUID(),
                patientId,
                professionalId,
                consultationDate: new Date(consultationDate),
                glucose,
                glucoseType,
                hba1c,
                footExamPerformed,
                footExamResult,
                weight,
                height,
                imc,
                medicationAdherence,
                observations,
                updatedAt: new Date(),
            }
        });

        // 2. Update the Diabetes Indicator (D1, D2, D3, D5, D6)
        // D1: Consultation in last 6 months
        // D5: Hba1c in last 12 months
        // D6: Foot exam in last 12 months

        const now = new Date();

        const updateData: any = {
            lastConsultationDate: new Date(consultationDate),
            lastAnthropometryDate: weight && height ? new Date(consultationDate) : undefined,
            d1Status: 'GREEN', // Consulta nos últimos 6 meses
            d3Status: weight && height ? 'GREEN' : undefined, // Antropometria nos últimos 12 meses
            lastUpdated: new Date()
        };

        console.log('[DiabetesService] ✅ Consulta registrada - Indicador D1 atualizado');

        if (hba1c) {
            updateData.lastHba1cDate = new Date(consultationDate);
            updateData.d5Status = 'GREEN';
            console.log('[DiabetesService] ✅ HbA1c registrada - Indicador D5 atualizado');
        }

        if (footExamPerformed) {
            updateData.lastFootExamDate = new Date(consultationDate);
            updateData.d6Status = 'GREEN';
            console.log('[DiabetesService] ✅ Avaliação dos pés registrada - Indicador D6 atualizado');
        }

        await prisma.diabetes_indicators.upsert({
            where: { patientId },
            update: updateData,
            create: {
                id: require('crypto').randomUUID(),
                patientId,
                lastConsultationDate: new Date(consultationDate),
                lastAnthropometryDate: weight && height ? new Date(consultationDate) : null,
                lastHba1cDate: hba1c ? new Date(consultationDate) : null,
                lastFootExamDate: footExamPerformed ? new Date(consultationDate) : null,
                d1Status: 'GREEN',
                d2Status: 'RED', // Será atualizado quando PA for registrada
                d3Status: weight && height ? 'GREEN' : 'RED',
                d4Status: 'RED', // Será atualizado quando visitas forem registradas
                d5Status: hba1c ? 'GREEN' : 'RED',
                d6Status: footExamPerformed ? 'GREEN' : 'RED',
                visitCountLast12Months: 0,
                lastUpdated: new Date()
            }
        });

        return consultation;
    }

    async getHistory(patientId: string) {
        return await prisma.diabetes_consultations.findMany({
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
                diabetes_indicators: true,
                home_visits: {
                    where: {
                        visitDate: {
                            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
            },
        });

        if (!patient || !patient.hasDiabetes) return;

        const now = new Date();
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

        const updates: any = {
            d4Status: (patient.home_visits?.length || 0) >= 2 ? 'GREEN' : (patient.home_visits?.length || 0) === 1 ? 'YELLOW' : 'RED',
            lastUpdated: now,
        };

        const lastBP = patient.diabetes_indicators?.lastBloodPressureDate;
        updates.d2Status = lastBP && new Date(lastBP) >= sixMonthsAgo ? 'GREEN' : 'RED';

        if (patient.diabetes_indicators) {
            await prisma.diabetes_indicators.update({
                where: { patientId },
                data: updates,
            });
        } else {
            await prisma.diabetes_indicators.create({
                data: {
                    id: require('crypto').randomUUID(),
                    patientId,
                    d1Status: 'RED',
                    d2Status: updates.d2Status,
                    d3Status: 'RED',
                    d4Status: updates.d4Status,
                    d5Status: 'RED',
                    d6Status: 'RED',
                    visitCountLast12Months: patient.home_visits?.length || 0,
                    lastUpdated: now,
                },
            });
        }
    }

    async registerAssessment(patientId: string, data: { type: 'FOOT_EXAM'; date: Date }) {
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            include: { diabetes_indicators: true },
        });

        if (!patient || !patient.hasDiabetes) {
            throw new AppError(404, 'Paciente diabético não encontrado', 'PATIENT_NOT_FOUND');
        }

        if (!patient.diabetes_indicators) {
            await prisma.diabetes_indicators.create({
                data: {
                    id: require('crypto').randomUUID(),
                    patientId,
                    d1Status: 'RED',
                    d2Status: 'RED',
                    d3Status: 'RED',
                    d4Status: 'RED',
                    d5Status: 'RED',
                    d6Status: data.type === 'FOOT_EXAM' ? 'GREEN' : 'RED',
                    lastFootExamDate: data.type === 'FOOT_EXAM' ? data.date : null,
                    visitCountLast12Months: 0,
                    lastUpdated: new Date(),
                },
            });
            return;
        }

        if (data.type === 'FOOT_EXAM') {
            await prisma.diabetes_indicators.update({
                where: { patientId },
                data: {
                    lastFootExamDate: data.date,
                    d6Status: 'GREEN',
                    lastUpdated: new Date(),
                },
            });
        }
    }
}






