import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
// import { logger } from '../utils/logger';

interface CreateChildcareConsultationInput {
    patientId: string;
    professionalId: string;
    consultationDate: Date;
    weight: number;
    height: number;
    headCircumference?: number;
    developmentMilestones: Record<string, boolean>;
    feedingType: 'EXCLUSIVE_BREASTFEEDING' | 'COMPLEMENTARY_FEEDING' | 'ARTIFICIAL_FEEDING' | 'MIXED_FEEDING';
    feedingObservations?: string;
    observations?: string;
}

interface RegisterVaccineInput {
    patientId: string;
    vaccineId: string;
    applicationDate: Date;
    dose: number;
    batchNumber?: string;
    appliedById: string;
}

export class ChildcareService {
    /**
     * Registrar consulta de puericultura
     */
    async registerConsultation(data: CreateChildcareConsultationInput) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: { childcare_indicators: true },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrada', 'PATIENT_NOT_FOUND');
        }

        if (!patient.isChild) {
            throw new AppError(400, 'Paciente não é uma criança', 'INVALID_PATIENT_TYPE');
        }

        const consultation = await prisma.childcare_consultations.create({
            data: {
                patientId: data.patientId,
                professionalId: data.professionalId,
                consultationDate: data.consultationDate,
                weight: data.weight,
                height: data.height,
                headCircumference: data.headCircumference,
                developmentMilestones: data.developmentMilestones,
                feedingType: data.feedingType,
                feedingObservations: data.feedingObservations,
                observations: data.observations,
            },
        });

        // Atualizar indicadores
        await this.updateConsultationIndicators(patient, consultation);

        return consultation;
    }

    /**
     * Atualizar indicadores após consulta
     */
    private async updateConsultationIndicators(patient: any, consultation: any) {
        if (!patient.childcareIndicator) return;

        const updates: any = {};

        // B1 - 1ª Consulta (até 30 dias de vida)
        if (!patient.childcareIndicator.firstConsultationDate) {
            updates.firstConsultationDate = consultation.consultationDate;

            const birthDate = new Date(patient.birthDate);
            const daysDiff = Math.floor((consultation.consultationDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 30) {
                updates.b1Status = 'GREEN';
            } else {
                updates.b1Status = 'YELLOW';
            }
        }

        // B2 - 9 Consultas (Contador regressivo)
        const consultationCount = patient.childcareIndicator.consultationCount + 1;
        updates.consultationCount = consultationCount;

        // Simplificação da regra de periodicidade (idealmente compararia com idade)
        if (consultationCount >= 9) {
            updates.b2Status = 'GREEN';
        } else if (consultationCount >= 5) {
            updates.b2Status = 'YELLOW';
        } else {
            updates.b2Status = 'RED';
        }

        // B3 - Peso/Altura (Gráfico)
        updates.anthropometryCount = patient.childcareIndicator.anthropometryCount + 1;
        if (updates.anthropometryCount >= 9) {
            updates.b3Status = 'GREEN';
        } else if (updates.anthropometryCount >= 5) {
            updates.b3Status = 'YELLOW';
        } else {
            updates.b3Status = 'RED';
        }

        await prisma.childcare_indicators.update({
            where: { id: patient.childcareIndicator.id },
            data: updates,
        });
    }

    /**
     * Registrar aplicação de vacina
     */
    async registerVaccine(data: RegisterVaccineInput) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: { childcare_indicators: true },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrada', 'PATIENT_NOT_FOUND');
        }

        const vaccineRecord = await prisma.vaccine_records.create({
            data: {
                patientId: data.patientId,
                vaccineId: data.vaccineId,
                applicationDate: data.applicationDate,
                dose: data.dose,
                batchNumber: data.batchNumber,
                appliedById: data.appliedById,
            },
            include: {
                vaccine: true,
            },
        });

        // Atualizar indicador de vacinas (B5 - simplificado)
        // Em um cenário real, verificaria todo o calendário
        await this.updateVaccineIndicators(patient);

        return vaccineRecord;
    }

    /**
     * Atualizar indicadores de vacina
     */
    private async updateVaccineIndicators(patient: any) {
        if (!patient.childcareIndicator) return;

        // Lógica simplificada: se tomou vacina recentemente, considera 'UP_TO_DATE'
        // A lógica completa exigiria verificar todas as vacinas esperadas para a idade

        await prisma.childcare_indicators.update({
            where: { id: patient.childcareIndicator.id },
            data: {
                vaccineStatus: 'UP_TO_DATE',
                b5Status: 'GREEN',
            },
        });
    }

    /**
     * Obter dados de puericultura
     */
    async getChildcareData(patientId: string) {
        const patient = await prisma.patients.findUnique({
            where: { id: patientId },
            include: {
                childcare_indicators: true,
                childcare_consultations: {
                    orderBy: { consultationDate: 'desc' },
                },
                vaccine_records: {
                    include: { vaccine: true },
                    orderBy: { applicationDate: 'desc' },
                },
            },
        });

        if (!patient) {
            return null;
        }

        return {
            patientId: patient.id,
            indicator: patient.childcareIndicator,
            consultations: patient.childcareConsultations,
            vaccines: patient.vaccineRecords,
        };
    }
}



