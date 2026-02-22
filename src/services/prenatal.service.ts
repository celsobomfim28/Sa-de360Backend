import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
// import { logger } from '../utils/logger';

interface CreatePrenatalDataInput {
    patientId: string;
    lastMenstrualDate: Date;
    isHighRisk?: boolean;
    previousPregnancies: number;
    previousDeliveries: number;
    previousAbortions: number;
}

// interface UpdatePrenatalDataInput {
//     deliveryDate?: Date;
//     deliveryType?: 'VAGINAL' | 'CESAREAN';
//     isHighRisk?: boolean;
// }

interface CreateConsultationInput {
    prenatalDataId: string;
    professionalId: string;
    consultationDate: Date;
    gestationalAge: number;
    weight: number;
    height?: number;
    bloodPressure: string;
    uterineHeight?: number;
    fetalHeartRate?: number;
    edema?: boolean;
    complaints?: string;
    conduct?: string;
    observations?: string;
}

interface CreatePostpartumConsultationInput {
    patientId: string;
    professionalId: string;
    consultationDate: Date;
    deliveryDate: Date;
    deliveryType: 'VAGINAL' | 'CESAREAN';
    weight: number;
    bloodPressure: string;
    uterineInvolution: 'ADEQUATE' | 'INADEQUATE';
    lochia: 'NORMAL' | 'ALTERED';
    breastfeeding: 'YES' | 'NO' | 'WITH_DIFFICULTIES';
    contraceptiveMethod?: string;
    observations?: string;
}

interface RegisterExamInput {
    prenatalDataId: string;
    examType: 'SYPHILIS_1ST_TRI' | 'HIV_1ST_TRI' | 'HEPATITIS_B_1ST_TRI' | 'HEPATITIS_C_1ST_TRI' | 'SYPHILIS_3RD_TRI' | 'HIV_3RD_TRI';
    requestDate: Date;
    resultDate?: Date;
    result?: string;
    evaluated?: boolean;
    evaluatedById?: string;
}

export class PrenatalService {
    /**
     * Iniciar pré-natal (criar registro)
     */
    async startPrenatal(data: CreatePrenatalDataInput) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrada', 'PATIENT_NOT_FOUND');
        }

        // Calcular DPP e idade gestacional
        const lastMenstrualDate = new Date(data.lastMenstrualDate);
        const expectedDeliveryDate = new Date(lastMenstrualDate);
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 280); // DPP = DUM + 280 dias

        const today = new Date();
        const gestationalAge = Math.floor((today.getTime() - lastMenstrualDate.getTime()) / (1000 * 60 * 60 * 24));

        // Criar dados do pré-natal
        const prenatalData = await prisma.prenatal_data.create({
            data: {
                patientId: data.patientId,
                lastMenstrualDate,
                expectedDeliveryDate,
                gestationalAge,
                isHighRisk: data.isHighRisk || false,
                previousPregnancies: data.previousPregnancies,
                previousDeliveries: data.previousDeliveries,
                previousAbortions: data.previousAbortions,
            },
        });

        // Atualizar status da paciente
        await prisma.patients.update({
            where: { id: data.patientId },
            data: { isPregnant: true },
        });

        // Criar indicadores iniciais
        await prisma.prenatal_indicators.create({
            data: {
                prenatalDataId: prenatalData.id,
                c1Status: 'RED',
                c2Status: 'RED',
                c3Status: 'RED',
                c4Status: 'RED',
                c5Status: 'RED',
                c6Status: 'RED',
            },
        });

        return prenatalData;
    }

    /**
     * Registrar consulta de pré-natal
     */
    async registerConsultation(data: CreateConsultationInput) {
        const prenatalData = await prisma.prenatal_data.findUnique({
            where: { id: data.prenatalDataId },
            include: { indicator: true },
        });

        if (!prenatalData) {
            throw new AppError(404, 'Dados de pré-natal não encontrados', 'PRENATAL_DATA_NOT_FOUND');
        }

        const consultation = await prisma.prenatal_consultations.create({
            data: {
                prenatalDataId: data.prenatalDataId,
                professionalId: data.professionalId,
                consultationDate: data.consultationDate,
                gestationalAge: data.gestationalAge,
                weight: data.weight,
                height: data.height,
                bloodPressure: data.bloodPressure,
                uterineHeight: data.uterineHeight,
                fetalHeartRate: data.fetalHeartRate,
                edema: data.edema || false,
                complaints: data.complaints,
                conduct: data.conduct,
                observations: data.observations,
            },
        });

        // Atualizar indicadores
        await this.updateConsultationIndicators(prenatalData, consultation);

        return consultation;
    }

    /**
     * Atualizar indicadores após consulta
     */
    private async updateConsultationIndicators(prenatalData: any, consultation: any) {
        const indicator = prenatalData.prenatal_indicators;
        if (!indicator) return;

        const updates: any = {};

        // C1 - Consultas (1ª até 12ª semana + 7 consultas + 1 puerpério)
        const consultationCount = indicator.prenatalConsultationCount + 1;
        updates.prenatalConsultationCount = consultationCount;

        // Verificar se é a primeira consulta e se foi até 12ª semana
        const lastMenstrualDate = new Date(prenatalData.lastMenstrualDate);
        const consultationDate = new Date(consultation.consultationDate);
        const weeksSinceLastMenstrual = Math.floor((consultationDate.getTime() - lastMenstrualDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

        if (consultationCount === 1) {
            if (weeksSinceLastMenstrual <= 12) {
                console.log('[PrenatalService] ✅ 1ª consulta DENTRO DO PRAZO (até 12ª semana)');
            } else {
                console.log('[PrenatalService] ⚠️ 1ª consulta FORA DO PRAZO - Gestante perdeu ponto do indicador C1');
                console.log(`[PrenatalService] Semanas desde última menstruação: ${weeksSinceLastMenstrual}`);
            }
        }

        // Status baseado no número de consultas + consulta de puerpério
        const hasPostpartumConsultation = indicator.postpartumConsultationDone;
        
        if (consultationCount >= 7 && hasPostpartumConsultation) {
            updates.c1Status = 'GREEN'; // 7 consultas + puerpério
        } else if (consultationCount >= 7 || (consultationCount >= 4 && hasPostpartumConsultation)) {
            updates.c1Status = 'YELLOW'; // 7 consultas OU 4+ consultas com puerpério
        } else {
            updates.c1Status = 'RED';
        }

        await prisma.prenatal_indicators.update({
            where: { prenatalDataId: prenatalData.id },
            data: updates,
        });
    }

    /**
     * Registrar consulta de puerpério
     */
    async registerPostpartumConsultation(data: CreatePostpartumConsultationInput) {
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: { prenatal_data: { include: { indicator: true } } },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrada', 'PATIENT_NOT_FOUND');
        }

        const consultation = await prisma.postpartum_consultations.create({
            data: {
                patientId: data.patientId,
                professionalId: data.professionalId,
                consultationDate: data.consultationDate,
                deliveryDate: data.deliveryDate,
                deliveryType: data.deliveryType,
                weight: data.weight,
                bloodPressure: data.bloodPressure,
                uterineInvolution: data.uterineInvolution,
                lochia: data.lochia,
                breastfeeding: data.breastfeeding,
                contraceptiveMethod: data.contraceptiveMethod,
                observations: data.observations,
            },
        });

        // Atualizar status da paciente
        await prisma.patients.update({
            where: { id: data.patientId },
            data: {
                isPregnant: false,
                isPostpartum: true,
            },
        });

        // Se houver dados de pré-natal ativos, encerrar e atualizar indicador
        if (patient.prenatalData) {
            await prisma.prenatal_data.update({
                where: { id: patient.prenatalData.id },
                data: {
                    deliveryDate: data.deliveryDate,
                    deliveryType: data.deliveryType,
                },
            });

            if (patient.prenatal_data.prenatal_indicators) {
                // Verificar prazo (até 42 dias pós-parto conforme documento)
                const daysDiff = Math.floor((data.consultationDate.getTime() - data.deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
                const isOnTime = daysDiff <= 42;

                if (isOnTime) {
                    console.log('[PrenatalService] ✅ Consulta de puerpério DENTRO DO PRAZO (até 42 dias)');
                } else {
                    console.log('[PrenatalService] ⚠️ Consulta de puerpério FORA DO PRAZO');
                    console.log(`[PrenatalService] Dias após parto: ${daysDiff}`);
                }

                const consultationCount = patient.prenatal_data.prenatal_indicators.prenatalConsultationCount;
                
                // Atualizar status C1
                let c1Status = 'RED';
                if (consultationCount >= 7 && isOnTime) {
                    c1Status = 'GREEN'; // 7 consultas + puerpério no prazo
                } else if (consultationCount >= 7 || consultationCount >= 4) {
                    c1Status = 'YELLOW'; // 7 consultas OU 4+ consultas
                }

                await prisma.prenatal_indicators.update({
                    where: { prenatalDataId: patient.prenatal_data.id },
                    data: {
                        postpartumConsultationDone: true,
                        c1Status: c1Status,
                    },
                });
            }
        }

        return consultation;
    }

    /**
     * Registrar exame de pré-natal
     */
    async registerExam(data: RegisterExamInput) {
        const prenatalData = await prisma.prenatal_data.findUnique({
            where: { id: data.prenatalDataId },
            include: { indicator: true },
        });

        if (!prenatalData) {
            throw new AppError(404, 'Dados de pré-natal não encontrados', 'PRENATAL_DATA_NOT_FOUND');
        }

        const exam = await prisma.prenatal_exams.create({
            data: {
                prenatalDataId: data.prenatalDataId,
                examType: data.examType,
                requestDate: data.requestDate,
                resultDate: data.resultDate,
                result: data.result,
                evaluated: data.evaluated || false,
                evaluatedById: data.evaluatedById,
                evaluatedAt: data.evaluated ? new Date() : null,
            },
        });

        // Atualizar indicador C6 (Exames)
        await this.updateExamIndicators(prenatalData);

        return exam;
    }

    /**
     * Atualizar indicadores de exames (C6)
     */
    private async updateExamIndicators(prenatalData: any) {
        // Verificar exames realizados
        const exams = await prisma.prenatal_exams.findMany({
            where: { prenatalDataId: prenatalData.id },
        });

        const exams1stTri = ['SYPHILIS_1ST_TRI', 'HIV_1ST_TRI', 'HEPATITIS_B_1ST_TRI', 'HEPATITIS_C_1ST_TRI'];
        const exams3rdTri = ['SYPHILIS_3RD_TRI', 'HIV_3RD_TRI'];

        const hasAll1stTri = exams1stTri.every(type =>
            exams.some((e: any) => e.examType === type && e.evaluated)
        );

        const hasAll3rdTri = exams3rdTri.every(type =>
            exams.some((e: any) => e.examType === type && e.evaluated)
        );

        const updates: any = {
            exams1stTriCompleted: hasAll1stTri,
            exams3rdTriCompleted: hasAll3rdTri,
        };

        if (hasAll1stTri && hasAll3rdTri) {
            updates.c6Status = 'GREEN';
            console.log('[PrenatalService] ✅ Todos os exames (1º e 3º trimestre) completos - Indicador C6 GREEN');
        } else if (hasAll1stTri) {
            updates.c6Status = 'YELLOW';
            console.log('[PrenatalService] ⚠️ Exames do 1º trimestre completos, faltam do 3º - Indicador C6 YELLOW');
        } else {
            updates.c6Status = 'RED';
            console.log('[PrenatalService] ❌ Exames incompletos - Indicador C6 RED');
        }

        if (prenatalData.prenatal_indicators) {
            await prisma.prenatal_indicators.update({
                where: { prenatalDataId: prenatalData.id },
                data: updates,
            });
        }
    }

    /**
     * Obter dados completos do pré-natal de uma paciente
     */
    async getPrenatalData(patientId: string) {
        const prenatalData = await prisma.prenatal_data.findUnique({
            where: { patientId },
            include: {
                indicator: true,
                consultations: {
                    orderBy: { consultationDate: 'desc' },
                },
                exams: {
                    orderBy: { requestDate: 'desc' },
                },
            },
        });

        if (!prenatalData) {
            return null; // Não tem pré-natal ativo
        }

        // Buscar consultas de puerpério
        const postpartumConsultations = await prisma.postpartum_consultations.findMany({
            where: { patientId },
            orderBy: { consultationDate: 'desc' },
        });

        return {
            ...prenatalData,
            postpartumConsultations,
        };
    }
}



