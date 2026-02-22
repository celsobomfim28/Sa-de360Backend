import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';

/**
 * Serviço para ações compartilhadas entre todos os profissionais
 * Baseado nas responsabilidades "TODOS" do documento de indicadores
 */
export class SharedActionsService {
    /**
     * Registrar dados antropométricos (peso e altura)
     * Responsabilidade compartilhada em: C2, C3, C4, C5, C6
     */
    async registerAnthropometry(data: {
        patientId: string;
        registeredById: string;
        measurementDate: Date;
        weight: number;
        height: number;
        observations?: string;
    }) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: {
                childcare_indicators: true,
                prenatal_data: { include: { indicator: true } },
                diabetes_indicators: true,
                hypertension_indicators: true,
                elderly_indicators: true,
            },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        const imc = data.weight / ((data.height / 100) * (data.height / 100));

        // Criar registro genérico
        const record = await prisma.anthropometryRecord.create({
            data: {
                patientId: data.patientId,
                registeredById: data.registeredById,
                measurementDate: data.measurementDate,
                weight: data.weight,
                height: data.height,
                imc,
                observations: data.observations,
            },
        });

        // Atualizar indicadores relevantes
        await this.updateAnthropometryIndicators(patient, data.measurementDate);

        return record;
    }

    /**
     * Atualizar indicadores após registro de antropometria
     */
    private async updateAnthropometryIndicators(patient: any, measurementDate: Date) {
        // C2 - Puericultura (B3)
        if (patient.isChild && patient.childcareIndicator) {
            const count = patient.childcareIndicator.anthropometryCount + 1;
            await prisma.childcare_indicators.update({
                where: { id: patient.childcareIndicator.id },
                data: {
                    anthropometryCount: count,
                    b3Status: count >= 9 ? 'GREEN' : count >= 5 ? 'YELLOW' : 'RED',
                },
            });
        }

        // C3 - Pré-natal (C4)
        if (patient.isPregnant && patient.prenatalData?.indicator) {
            await prisma.prenatal_indicators.update({
                where: { id: patient.prenatalData.indicator.id },
                data: {
                    weightHeightRecorded: true,
                    c3Status: 'GREEN',
                },
            });
        }

        // C4 - Diabetes (D3)
        if (patient.hasDiabetes && patient.diabetesIndicator) {
            await prisma.diabetes_indicators.update({
                where: { id: patient.diabetesIndicator.id },
                data: {
                    lastAnthropometryDate: measurementDate,
                    d3Status: 'GREEN',
                },
            });
        }

        // C5 - Hipertensão (E3)
        if (patient.hasHypertension && patient.hypertensionIndicator) {
            await prisma.hypertension_indicators.update({
                where: { id: patient.hypertensionIndicator.id },
                data: {
                    lastAnthropometryDate: measurementDate,
                    e3Status: 'GREEN',
                },
            });
        }

        // C6 - Idoso (F2 - parte da avaliação)
        if (patient.isElderly && patient.elderlyIndicator) {
            // Antropometria faz parte da avaliação multidimensional
            await prisma.elderly_indicators.update({
                where: { id: patient.elderlyIndicator.id },
                data: {
                    lastUpdated: measurementDate,
                },
            });
        }
    }

    /**
     * Registrar aferição de pressão arterial
     * Responsabilidade compartilhada em: C3, C4, C5
     */
    async registerBloodPressure(data: {
        patientId: string;
        registeredById: string;
        measurementDate: Date;
        systolicBP: number;
        diastolicBP: number;
        observations?: string;
    }) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: {
                prenatal_data: { include: { indicator: true } },
                diabetes_indicators: true,
                hypertension_indicators: true,
            },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        // Criar registro genérico
        const record = await prisma.bloodPressureRecord.create({
            data: {
                patientId: data.patientId,
                registeredById: data.registeredById,
                measurementDate: data.measurementDate,
                systolicBP: data.systolicBP,
                diastolicBP: data.diastolicBP,
                observations: data.observations,
            },
        });

        // Atualizar indicadores relevantes
        await this.updateBloodPressureIndicators(patient, data.measurementDate);

        return record;
    }

    /**
     * Atualizar indicadores após registro de PA
     */
    private async updateBloodPressureIndicators(patient: any, measurementDate: Date) {
        // C3 - Pré-natal (C2)
        if (patient.isPregnant && patient.prenatalData?.indicator) {
            const count = patient.prenatalData.indicator.bloodPressureCount + 1;
            await prisma.prenatal_indicators.update({
                where: { id: patient.prenatalData.indicator.id },
                data: {
                    bloodPressureCount: count,
                    c2Status: count >= 7 ? 'GREEN' : count >= 4 ? 'YELLOW' : 'RED',
                },
            });
        }

        // C4 - Diabetes (D2)
        if (patient.hasDiabetes && patient.diabetesIndicator) {
            await prisma.diabetes_indicators.update({
                where: { id: patient.diabetesIndicator.id },
                data: {
                    lastBloodPressureDate: measurementDate,
                    d2Status: 'GREEN',
                },
            });
        }

        // C5 - Hipertensão (E2)
        if (patient.hasHypertension && patient.hypertensionIndicator) {
            await prisma.hypertension_indicators.update({
                where: { id: patient.hypertensionIndicator.id },
                data: {
                    lastBloodPressureDate: measurementDate,
                    e2Status: 'GREEN',
                },
            });
        }
    }

    /**
     * Registrar aplicação de vacina (genérico)
     * Responsabilidade compartilhada em: C2, C3, C6, C7
     */
    async registerVaccine(data: {
        patientId: string;
        vaccineId: string;
        registeredById: string;
        applicationDate: Date;
        dose: number;
        batchNumber?: string;
        observations?: string;
    }) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: {
                childcare_indicators: true,
                prenatal_data: { include: { indicator: true } },
                elderly_indicators: true,
            },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        // Criar registro de vacina
        const record = await prisma.vaccine_records.create({
            data: {
                patientId: data.patientId,
                vaccineId: data.vaccineId,
                appliedById: data.registeredById,
                applicationDate: data.applicationDate,
                dose: data.dose,
                batchNumber: data.batchNumber,
            },
            include: {
                vaccine: true,
            },
        });

        // Atualizar indicadores relevantes
        await this.updateVaccineIndicators(patient, record);

        return record;
    }

    /**
     * Atualizar indicadores após registro de vacina
     */
    private async updateVaccineIndicators(patient: any, vaccineRecord: any) {
        const vaccineName = vaccineRecord.vaccine.name.toUpperCase();

        // C2 - Puericultura (B5)
        if (patient.isChild && patient.childcareIndicator) {
            await prisma.childcare_indicators.update({
                where: { id: patient.childcareIndicator.id },
                data: {
                    vaccineStatus: 'UP_TO_DATE',
                    b5Status: 'GREEN',
                },
            });
        }

        // C3 - Pré-natal (C5 - dTpa)
        if (patient.isPregnant && patient.prenatalData?.indicator) {
            if (vaccineName.includes('DTPA') || vaccineName.includes('DIFTERIA')) {
                await prisma.prenatal_indicators.update({
                    where: { id: patient.prenatalData.indicator.id },
                    data: {
                        dtpaVaccineApplied: true,
                        c5Status: 'GREEN',
                    },
                });
            }
        }

        // C6 - Idoso (Influenza)
        if (patient.isElderly && patient.elderlyIndicator) {
            if (vaccineName.includes('INFLUENZA') || vaccineName.includes('GRIPE')) {
                await prisma.elderly_indicators.update({
                    where: { id: patient.elderlyIndicator.id },
                    data: {
                        lastInfluenzaVaccineDate: vaccineRecord.applicationDate,
                    },
                });
            }
        }

        // C7 - Saúde da Mulher (HPV)
        if (patient.isWoman && vaccineName.includes('HPV')) {
            // Atualizar registro de HPV (simplificado)
            // Em um sistema real, verificaria idade e doses
        }
    }

    /**
     * Obter histórico de ações compartilhadas de um paciente
     */
    async getPatientSharedActionsHistory(patientId: string) {
        const [anthropometry, bloodPressure, vaccines] = await Promise.all([
            prisma.anthropometryRecord.findMany({
                where: { patientId },
                include: {
                    registeredBy: {
                        select: { fullName: true, role: true },
                    },
                },
                orderBy: { measurementDate: 'desc' },
            }),
            prisma.bloodPressureRecord.findMany({
                where: { patientId },
                include: {
                    registeredBy: {
                        select: { fullName: true, role: true },
                    },
                },
                orderBy: { measurementDate: 'desc' },
            }),
            prisma.vaccine_records.findMany({
                where: { patientId },
                include: {
                    vaccine: true,
                    appliedBy: {
                        select: { fullName: true, role: true },
                    },
                },
                orderBy: { applicationDate: 'desc' },
            }),
        ]);

        return {
            anthropometry,
            bloodPressure,
            vaccines,
        };
    }
}



