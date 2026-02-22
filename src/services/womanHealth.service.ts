import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export class WomanHealthService {
    /**
     * Update woman health indicators (G1, G2, G3)
     */
    async updateIndicators(patientId: string) {
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            include: {
                woman_exams: {
                    orderBy: { examDate: 'desc' }
                },
                woman_health_indicators: true
            }
        });

        if (!patient || !patient.isWoman) {
            return;
        }

        const now = new Date();
        const age = Math.floor((now.getTime() - new Date(patient.birthDate).getTime()) / (31557600000));

        let indicator = patient.woman_health_indicators;
        if (!indicator) {
            indicator = await prisma.woman_health_indicators.create({
                data: {
                    id: require('crypto').randomUUID(),
                    patientId,
                    g1Status: 'RED',
                    g2Status: 'RED',
                    cStatus: 'RED',
                    bStatus: 'RED',
                    lastUpdated: new Date()
                }
            });
        }

        const updates: any = {};

        // G1: Citopatológico (Colo de Útero) - Últimos 36 meses para mulheres de 25 a 64 anos
        const lastPapSmear = patient.woman_exams.find((e: any) => e.type === 'PAP_SMEAR');
        if (lastPapSmear) {
            updates.lastPapSmearDate = lastPapSmear.examDate;
            const monthsSince = (now.getTime() - lastPapSmear.examDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

            if (monthsSince <= 36) {
                updates.g1Status = 'GREEN';
                console.log('[WomanHealthService] ✅ Papanicolau nos últimos 36 meses - Indicador G1 GREEN');
            } else if (monthsSince <= 42) {
                updates.g1Status = 'YELLOW';
                console.log('[WomanHealthService] ⚠️ Papanicolau atrasado - Indicador G1 YELLOW');
            } else {
                updates.g1Status = 'RED';
                console.log('[WomanHealthService] ❌ Papanicolau muito atrasado - Indicador G1 RED');
            }
        } else {
            updates.g1Status = (age >= 25 && age <= 64) ? 'RED' : 'GREEN';
            if (age >= 25 && age <= 64) {
                console.log('[WomanHealthService] ❌ Papanicolau nunca realizado - Indicador G1 RED');
            }
        }

        // G2: Mamografia - Últimos 24 meses para mulheres de 50 a 69 anos
        const lastMammography = patient.woman_exams.find((e: any) => e.type === 'MAMMOGRAPHY');
        if (lastMammography) {
            updates.lastMammographyDate = lastMammography.examDate;
            const monthsSince = (now.getTime() - lastMammography.examDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

            if (monthsSince <= 24) {
                updates.g2Status = 'GREEN';
                console.log('[WomanHealthService] ✅ Mamografia nos últimos 24 meses - Indicador G2 GREEN');
            } else if (monthsSince <= 30) {
                updates.g2Status = 'YELLOW';
                console.log('[WomanHealthService] ⚠️ Mamografia atrasada - Indicador G2 YELLOW');
            } else {
                updates.g2Status = 'RED';
                console.log('[WomanHealthService] ❌ Mamografia muito atrasada - Indicador G2 RED');
            }
        } else {
            updates.g2Status = (age >= 50 && age <= 69) ? 'RED' : 'GREEN';
            if (age >= 50 && age <= 69) {
                console.log('[WomanHealthService] ❌ Mamografia nunca realizada - Indicador G2 RED');
            }
        }

        // C: Saúde Sexual e Reprodutiva - Últimos 12 meses para idade 14-69 anos
        if (indicator?.lastSexualHealthConsultationDate) {
            const consultationDate = new Date(indicator.lastSexualHealthConsultationDate);
            updates.lastSexualHealthConsultationDate = consultationDate;
            const monthsSince = (now.getTime() - consultationDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

            if (monthsSince <= 12) updates.cStatus = 'GREEN';
            else if (monthsSince <= 18) updates.cStatus = 'YELLOW';
            else updates.cStatus = 'RED';
        } else {
            updates.cStatus = (age >= 14 && age <= 69) ? 'RED' : 'GREEN';
        }

        updates.lastUpdated = new Date();

        await prisma.woman_health_indicators.update({
            where: { patientId: patient.id },
            data: updates
        });
    }

    /**
     * Register a woman health exam (Pap smear or Mammography)
     */
    async registerExam(data: {
        patientId: string;
        type: 'PAP_SMEAR' | 'MAMMOGRAPHY';
        examDate: Date;
        result?: string;
        observations?: string;
        performedById?: string;
    }) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId }
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        if (!patient.isWoman) {
            throw new AppError(400, 'Paciente não é do sexo feminino ou elegível para saúde da mulher', 'INVALID_CONDITION');
        }

        const exam = await prisma.woman_exams.create({
            data: {
                id: require('crypto').randomUUID(),
                patientId: data.patientId,
                type: data.type,
                examDate: data.examDate,
                result: data.result,
                observations: data.observations,
                performedById: data.performedById,
                updatedAt: new Date(),
            }
        });

        await this.updateIndicators(data.patientId);

        return exam;
    }

    /**
     * Register a woman health consultation (Sexual and Reproductive Health)
     */
    async registerConsultation(data: {
        patientId: string;
        professionalId: string;
        consultationDate: Date;
        consultationType: 'SEXUAL_REPRODUCTIVE_HEALTH' | 'CONTRACEPTION' | 'FAMILY_PLANNING' | 'STI_PREVENTION' | 'GENERAL_ORIENTATION';
        topics: string[];
        contraceptiveMethodDiscussed: boolean;
        contraceptiveMethodPrescribed?: string;
        observations?: string;
    }) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId }
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        if (!patient.isWoman) {
            throw new AppError(400, 'Paciente não é do sexo feminino ou elegível para saúde da mulher', 'INVALID_CONDITION');
        }

        await prisma.woman_health_indicators.upsert({
            where: { patientId: data.patientId },
            update: {
                lastSexualHealthConsultationDate: data.consultationDate,
                cStatus: 'GREEN',
                lastUpdated: new Date(),
            },
            create: {
                id: require('crypto').randomUUID(),
                patientId: data.patientId,
                g1Status: 'RED',
                g2Status: 'RED',
                cStatus: 'GREEN',
                bStatus: 'RED',
                lastSexualHealthConsultationDate: data.consultationDate,
                lastUpdated: new Date(),
            },
        });

        await this.updateIndicators(data.patientId);

        return {
            id: require('crypto').randomUUID(),
            ...data,
        };
    }

    /**
     * Get dashboard data for woman health
     */
    async getDashboardData(microAreaId?: string) {
        const where: any = {
            isWoman: true,
            deletedAt: null
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const patients = await prisma.patients.findMany({
            where,
            include: {
                woman_health_indicators: true,
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
            micro_areas: p.micro_areas?.name,
            indicators: p.woman_health_indicators || {
                g1Status: 'RED',
                g2Status: 'RED',
                cStatus: 'RED'
            }
        }));
    }

    /**
     * Get complete woman health data for a patient
     */
    async getPatientData(patientId: string) {
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            include: {
                woman_health_indicators: true,
                woman_exams: {
                    include: {
                        users: {
                            select: { fullName: true, role: true }
                        }
                    },
                    orderBy: { examDate: 'desc' }
                }
            }
        });

        if (!patient) {
            return null;
        }

        return {
            patientId: patient.id,
            indicator: patient.woman_health_indicators,
            exams: patient.woman_exams,
            consultations: []
        };
    }
}




