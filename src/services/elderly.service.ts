import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class ElderlyService {
    /**
     * Update elderly care indicators (A, B, F1, F2, C3, D)
     */
    async updateIndicators(patientId: string) {
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            include: {
                elderly_consultations: {
                    orderBy: { consultationDate: 'desc' },
                    take: 1
                },
                elderly_indicators: true,
                anthropometry: {
                    orderBy: { measurementDate: 'desc' },
                    take: 1
                },
                vaccine_records: {
                    where: {
                        vaccines: {
                            name: { equals: 'Influenza', mode: 'insensitive' }
                        }
                    },
                    orderBy: { applicationDate: 'desc' },
                    take: 1
                }
            }
        });

        if (!patient || !patient.isElderly) {
            return;
        }

        let indicator = patient.elderly_indicators;
        if (!indicator) {
            indicator = await prisma.elderly_indicators.create({
                data: {
                    id: require('crypto').randomUUID(),
                    patientId,
                    aStatus: 'RED',
                    bStatus: 'RED',
                    f1Status: 'RED',
                    f2Status: 'RED',
                    c3Status: 'RED',
                    dStatus: 'RED',
                    visitCountLast12Months: 0,
                    lastUpdated: new Date()
                }
            });
        }

        const updates: any = {};
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        const lastConsultation = patient.elderly_consultations[0];

        // A: Consulta nos últimos 12 meses (Médico/Enfermeiro)
        if (lastConsultation) {
            updates.lastConsultationDate = lastConsultation.consultationDate;
            if (lastConsultation.consultationDate >= twelveMonthsAgo) {
                updates.aStatus = 'GREEN';
                console.log('[ElderlyService] ✅ Consulta nos últimos 12 meses - Indicador A atualizado');
            } else {
                updates.aStatus = 'RED';
                console.log('[ElderlyService] ⚠️ Consulta FORA DO PRAZO (últimos 12 meses)');
            }

            // F1: Polifarmácia
            updates.polypharmacyUpdatedDate = lastConsultation.consultationDate;
            updates.hasPolypharmacy = lastConsultation.medicationsCount >= 5;

            if (lastConsultation.consultationDate < twelveMonthsAgo) {
                updates.f1Status = 'RED';
            } else {
                updates.f1Status = lastConsultation.medicationsCount >= 5 ? 'YELLOW' : 'GREEN';
                console.log('[ElderlyService] ✅ Polifarmácia avaliada - Indicador F1 atualizado');
            }

            // F2: IVCF-20 (Avaliação Multidimensional)
            updates.lastIvcfDate = lastConsultation.consultationDate;
            updates.ivcfScore = lastConsultation.ivcfScore;

            if (lastConsultation.consultationDate < twelveMonthsAgo) {
                updates.f2Status = 'RED';
            } else {
                updates.f2Status = 'GREEN';
                console.log('[ElderlyService] ✅ IVCF avaliado - Indicador F2 atualizado');
            }

        } else {
            updates.aStatus = 'RED';
            updates.f1Status = 'RED';
            updates.f2Status = 'RED';
        }

        // B: Antropometria nos últimos 12 meses
        const lastAnthropometry = patient.anthropometry[0];
        if (lastAnthropometry) {
            updates.lastAnthropometryDate = lastAnthropometry.measurementDate;
            if (lastAnthropometry.measurementDate >= twelveMonthsAgo) {
                updates.bStatus = 'GREEN';
                console.log('[ElderlyService] ✅ Antropometria nos últimos 12 meses - Indicador B atualizado');
            } else {
                updates.bStatus = 'RED';
            }
        } else {
            updates.bStatus = 'RED';
        }

        // D: Vacina Influenza nos últimos 12 meses
        const lastInfluenzaVaccine = patient.vaccine_records[0];
        if (lastInfluenzaVaccine) {
            updates.lastInfluenzaVaccineDate = lastInfluenzaVaccine.applicationDate;
            if (lastInfluenzaVaccine.applicationDate >= twelveMonthsAgo) {
                updates.dStatus = 'GREEN';
                console.log('[ElderlyService] ✅ Vacina Influenza nos últimos 12 meses - Indicador D atualizado');
            } else {
                updates.dStatus = 'RED';
            }
        } else {
            updates.dStatus = 'RED';
        }

        updates.lastUpdated = new Date();

        await prisma.elderly_indicators.update({
            where: { patientId: patient.id },
            data: updates
        });
    }

    /**
     * Register an elderly consultation/assessment
     */
    async registerConsultation(data: {
        patientId: string;
        professionalId: string;
        consultationDate: Date;
        medicationsCount: number;
        medicationsList?: string;
        ivcfScore?: number;
        observations?: string;
    }) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId }
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        if (!patient.isElderly) {
            throw new AppError(400, 'Paciente não é idoso', 'INVALID_CONDITION');
        }

        const consultation = await prisma.elderly_consultations.create({
            data: {
                id: require('crypto').randomUUID(),
                ...data,
                updatedAt: new Date(),
                isVulnerable: (data.ivcfScore || 0) >= 15 // Exemplo de corte
            }
        });

        await this.updateIndicators(data.patientId);

        return consultation;
    }

    /**
     * Get dashboard data for elderly care
     */
    async getDashboardData(microAreaId?: string) {
        const where: any = {
            isElderly: true,
            deletedAt: null
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const patients = await prisma.patients.findMany({
            where,
            include: {
                elderly_indicators: true,
                micro_areas: {
                    select: { name: true }
                }
            },
            orderBy: { fullName: 'asc' }
        });

        return patients.map((p: any) => ({
            id: p.id,
            fullName: p.fullName,
            age: Math.floor((new Date().getTime() - new Date(p.birthDate).getTime()) / (31557600000)),
            micro_areas: p.microArea.name,
            indicators: p.elderlyIndicator || {
                f1Status: 'RED', // Polifarmácia
                f2Status: 'RED'  // IVCF
            }
        }));
    }
}




