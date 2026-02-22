import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

interface CreateHomeVisitInput {
    patientId: string;
    acsId: string;
    visitDate: Date;
    visitType: 'NEWBORN_VD1' | 'NEWBORN_VD2' | 'PREGNANT_VD1' | 'PREGNANT_VD2' | 'PREGNANT_VD3' | 'POSTPARTUM_VD' | 'ACTIVE_SEARCH' | 'ROUTINE';
    purpose: string;
    observations?: string;
    latitude?: number;
    longitude?: number;
}

interface UpdateHomeVisitInput {
    visitDate?: Date;
    purpose?: string;
    observations?: string;
    latitude?: number;
    longitude?: number;
}

export class HomeVisitService {
    /**
     * Criar nova visita domiciliar
     */
    async create(data: CreateHomeVisitInput & { 
        weight?: number; 
        height?: number; 
        systolicBP?: number; 
        diastolicBP?: number; 
        glucose?: number;
    }) {
        console.log('[HomeVisitService] Criando visita com dados:', JSON.stringify(data, null, 2));
        
        // Verificar se paciente existe
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
            include: {
                childcare_indicators: true,
                prenatal_data: {
                    include: {
                        prenatal_indicators: true,
                    },
                },
                diabetes_indicators: true,
                hypertension_indicators: true,
                elderly_indicators: true,
            },
        });

        if (!patient) {
            console.error('[HomeVisitService] Paciente não encontrado:', data.patientId);
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        // Verificar se ACS existe
        const acs = await prisma.users.findUnique({
            where: { id: data.acsId },
        });

        if (!acs || acs.role !== 'ACS') {
            console.error('[HomeVisitService] ACS não encontrado ou inválido:', data.acsId);
            throw new AppError(404, 'ACS não encontrado', 'ACS_NOT_FOUND');
        }

        console.log('[HomeVisitService] Validações OK, criando registro no banco...');
        
        // Criar visita
        try {
            const now = new Date();
            const homeVisit = await prisma.home_visits.create({
                data: {
                    id: randomUUID(), // Gerar ID único
                    patientId: data.patientId,
                    acsId: data.acsId,
                    visitDate: data.visitDate,
                    visitType: data.visitType,
                    purpose: data.purpose,
                    observations: data.observations,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    updatedAt: now, // Campo obrigatório
                },
                include: {
                    patients: {
                        select: {
                            id: true,
                            fullName: true,
                            cpf: true,
                            birthDate: true,
                            street: true,
                            number: true,
                            neighborhood: true,
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            });
            
            console.log('[HomeVisitService] Visita criada com sucesso:', homeVisit.id);

            // Registrar procedimentos se fornecidos
            
            // Registrar peso e altura (antropometria)
            if (data.weight || data.height) {
                try {
                    const imc = data.weight && data.height 
                        ? parseFloat((data.weight / Math.pow(data.height / 100, 2)).toFixed(2))
                        : undefined;
                    
                    await prisma.anthropometry.create({
                        data: {
                            id: randomUUID(),
                            patientId: data.patientId,
                            professionalId: data.acsId,
                            measurementDate: data.visitDate,
                            weight: data.weight,
                            height: data.height,
                            imc: imc,
                            createdAt: now,
                            updatedAt: now,
                        },
                    });
                    console.log('[HomeVisitService] Antropometria registrada');
                } catch (error) {
                    console.error('[HomeVisitService] Erro ao registrar antropometria:', error);
                }
            }
            
            // Registrar pressão arterial
            if (data.systolicBP && data.diastolicBP) {
                try {
                    await prisma.blood_pressure.create({
                        data: {
                            id: randomUUID(),
                            patientId: data.patientId,
                            professionalId: data.acsId,
                            measurementDate: data.visitDate,
                            systolicBP: data.systolicBP,
                            diastolicBP: data.diastolicBP,
                            createdAt: now,
                            updatedAt: now,
                        },
                    });
                    console.log('[HomeVisitService] Pressão arterial registrada');
                } catch (error) {
                    console.error('[HomeVisitService] Erro ao registrar pressão arterial:', error);
                }
            }
            
            // Registrar glicemia
            if (data.glucose) {
                try {
                    await prisma.glucose_measurement.create({
                        data: {
                            id: randomUUID(),
                            patientId: data.patientId,
                            professionalId: data.acsId,
                            measurementDate: data.visitDate,
                            glucose: data.glucose,
                            createdAt: now,
                            updatedAt: now,
                        },
                    });
                    console.log('[HomeVisitService] Glicemia registrada');
                } catch (error) {
                    console.error('[HomeVisitService] Erro ao registrar glicemia:', error);
                }
            }

            // Atualizar indicadores baseado no tipo de visita
            await this.updateIndicators(patient, data.visitType, data.visitDate);

            logger.info(`Visita domiciliar criada: ${homeVisit.id} para paciente ${patient.fullName}`);

            return this.formatHomeVisitResponse(homeVisit);
        } catch (error) {
            console.error('[HomeVisitService] Erro ao criar visita no Prisma:', error);
            throw error;
        }
    }

    /**
     * Listar visitas domiciliares
     */
    async list(filters: {
        acsId?: string;
        patientId?: string;
        microAreaId?: string;
        visitType?: string;
        startDate?: Date;
        endDate?: Date;
        page: number;
        limit: number;
    }) {
        const { acsId, patientId, microAreaId, visitType, startDate, endDate, page, limit } = filters;

        const where: any = {};

        if (acsId) {
            where.acsId = acsId;
        }

        if (patientId) {
            where.patientId = patientId;
        }

        if (microAreaId) {
            where.patients = {
                microAreaId,
            };
        }

        if (visitType) {
            where.visitType = visitType;
        }

        if (startDate || endDate) {
            where.visitDate = {};
            if (startDate) {
                where.visitDate.gte = startDate;
            }
            if (endDate) {
                where.visitDate.lte = endDate;
            }
        }

        const [homeVisits, total] = await Promise.all([
            prisma.home_visits.findMany({
                where,
                include: {
                    patients: {
                        select: {
                            id: true,
                            fullName: true,
                            cpf: true,
                            birthDate: true,
                            street: true,
                            number: true,
                            neighborhood: true,
                            micro_areas: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { visitDate: 'desc' },
            }),
            prisma.home_visits.count({ where }),
        ]);

        return {
            data: homeVisits.map((v) => this.formatHomeVisitResponse(v)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Buscar visita por ID
     */
    async getById(id: string) {
        const homeVisit = await prisma.home_visits.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        cpf: true,
                        birthDate: true,
                        street: true,
                        number: true,
                        neighborhood: true,
                        primaryPhone: true,
                        micro_areas: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                users: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!homeVisit) {
            throw new AppError(404, 'Visita domiciliar não encontrada', 'HOME_VISIT_NOT_FOUND');
        }

        return this.formatHomeVisitResponse(homeVisit);
    }

    /**
     * Atualizar visita domiciliar
     */
    async update(id: string, data: UpdateHomeVisitInput) {
        const homeVisit = await prisma.home_visits.findUnique({
            where: { id },
        });

        if (!homeVisit) {
            throw new AppError(404, 'Visita domiciliar não encontrada', 'HOME_VISIT_NOT_FOUND');
        }

        const updated = await prisma.home_visits.update({
            where: { id },
            data,
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        logger.info(`Visita domiciliar atualizada: ${id}`);

        return this.formatHomeVisitResponse(updated);
    }

    /**
     * Listar visitas pendentes para o ACS
     */
    async getPendingVisits(acsId: string) {
        // Buscar microárea do ACS
        const acs = await prisma.users.findUnique({
            where: { id: acsId },
            include: {
                micro_areas: true,
            },
        });

        if (!acs || !acs.microArea) {
            throw new AppError(404, 'ACS ou microárea não encontrada', 'ACS_NOT_FOUND');
        }

        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Buscar crianças que precisam de VD1 ou VD2
        const childrenNeedingVisits = await prisma.patients.findMany({
            where: {
                microAreaId: acs.microArea.id,
                isChild: true,
                childcare_indicators: {
                    OR: [
                        { vd1Date: null },
                        { vd2Date: null },
                    ],
                },
            },
            include: {
                childcare_indicators: true,
            },
        });

        // Buscar gestantes que precisam de visitas
        const pregnantNeedingVisits = await prisma.patients.findMany({
            where: {
                microAreaId: acs.microArea.id,
                isPregnant: true,
                prenatal_data: {
                    indicator: {
                        OR: [
                            { vd1Date: null },
                            { vd2Date: null },
                            { vd3Date: null },
                        ],
                    },
                },
            },
            include: {
                prenatal_data: {
                    include: {
                        indicator: true,
                    },
                },
            },
        });

        // Buscar pacientes faltosos (para busca ativa)
        const absentPatients = await prisma.appointments.findMany({
            where: {
                status: 'ABSENT',
                absenceReportedAt: {
                    gte: thirtyDaysAgo,
                },
                patient: {
                    microAreaId: acs.microArea.id,
                },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        cpf: true,
                        birthDate: true,
                        street: true,
                        number: true,
                        neighborhood: true,
                        primaryPhone: true,
                    },
                },
            },
            distinct: ['patientId'],
        });

        return {
            childrenNeedingVisits: childrenNeedingVisits.map((p) => ({
                patient: {
                    id: p.id,
                    fullName: p.fullName,
                    birthDate: p.birthDate,
                    address: `${p.street}, ${p.number} - ${p.neighborhood}`,
                },
                pendingVisits: {
                    vd1: !p.childcareIndicator?.vd1Date,
                    vd2: !p.childcareIndicator?.vd2Date,
                },
            })),
            pregnantNeedingVisits: pregnantNeedingVisits.map((p) => ({
                patient: {
                    id: p.id,
                    fullName: p.fullName,
                    birthDate: p.birthDate,
                    address: `${p.street}, ${p.number} - ${p.neighborhood}`,
                },
                pendingVisits: {
                    vd1: !p.prenatalData?.indicator?.vd1Date,
                    vd2: !p.prenatalData?.indicator?.vd2Date,
                    vd3: !p.prenatalData?.indicator?.vd3Date,
                },
            })),
            absentPatients: absentPatients.map((a) => ({
                patient: a.patient,
                reason: 'Busca ativa - Faltou à consulta',
            })),
        };
    }

    /**
     * Atualizar indicadores baseado no tipo de visita e procedimentos realizados
     */
    private async updateIndicators(patient: any, visitType: string, visitDate: Date) {
        console.log('[HomeVisitService] Atualizando indicadores para paciente:', patient.id);
        
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

        // Atualizar indicadores de criança (C2)
        if (patient.childcare_indicators) {
            const updates: any = {};

            // Visitas domiciliares - B4 requer 02 visitas: VD1 (até 30 dias) e VD2 (até 6 meses)
            const birthDate = new Date(patient.birthDate);
            const thirtyDaysAfterBirth = new Date(birthDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            const sixMonthsAfterBirth = new Date(birthDate.getTime() + 180 * 24 * 60 * 60 * 1000);
            const visitDateObj = new Date(visitDate);
            
            // Se é visita específica de recém-nascido, registrar
            if (visitType === 'NEWBORN_VD1' && !patient.childcare_indicators.vd1Date) {
                updates.vd1Date = visitDate;
                console.log('[HomeVisitService] Visita registrada como VD1 (tipo específico)');
            } else if (visitType === 'NEWBORN_VD2' && !patient.childcare_indicators.vd2Date) {
                updates.vd2Date = visitDate;
                console.log('[HomeVisitService] Visita registrada como VD2 (tipo específico)');
            } 
            // Se é visita de rotina/busca ativa, contar como VD1 ou VD2 (o que estiver faltando)
            else if (visitType === 'ROUTINE' || visitType === 'ACTIVE_SEARCH') {
                // Se não tem VD1
                if (!patient.childcare_indicators.vd1Date) {
                    updates.vd1Date = visitDate;
                    
                    // Verificar se está dentro do prazo (até 30 dias)
                    if (visitDateObj <= thirtyDaysAfterBirth) {
                        console.log('[HomeVisitService] ✅ VD1 registrada DENTRO DO PRAZO (até 30 dias)');
                    } else {
                        console.log('[HomeVisitService] ⚠️ VD1 registrada FORA DO PRAZO - ACS perdeu o ponto do indicador B4');
                        console.log(`[HomeVisitService] Prazo limite: ${thirtyDaysAfterBirth.toISOString()}, Visita: ${visitDateObj.toISOString()}`);
                    }
                }
                // Se já tem VD1 mas não tem VD2
                else if (!patient.childcare_indicators.vd2Date) {
                    updates.vd2Date = visitDate;
                    
                    // Verificar se está dentro do prazo (até 6 meses)
                    if (visitDateObj <= sixMonthsAfterBirth) {
                        console.log('[HomeVisitService] ✅ VD2 registrada DENTRO DO PRAZO (até 6 meses)');
                    } else {
                        console.log('[HomeVisitService] ⚠️ VD2 registrada FORA DO PRAZO - ACS perdeu o ponto do indicador B4');
                        console.log(`[HomeVisitService] Prazo limite: ${sixMonthsAfterBirth.toISOString()}, Visita: ${visitDateObj.toISOString()}`);
                    }
                }
            }

            // Recalcular status B4 considerando os prazos
            const vd1Done = updates.vd1Date || patient.childcare_indicators.vd1Date;
            const vd2Done = updates.vd2Date || patient.childcare_indicators.vd2Date;
            
            // Verificar se as visitas foram feitas dentro do prazo
            let vd1OnTime = false;
            let vd2OnTime = false;
            
            if (vd1Done) {
                const vd1DateObj = new Date(vd1Done);
                vd1OnTime = vd1DateObj <= thirtyDaysAfterBirth;
            }
            
            if (vd2Done) {
                const vd2DateObj = new Date(vd2Done);
                vd2OnTime = vd2DateObj <= sixMonthsAfterBirth;
            }

            // Status baseado nas visitas E nos prazos
            if (vd1Done && vd2Done && vd1OnTime && vd2OnTime) {
                updates.b4Status = 'GREEN'; // Ambas as visitas dentro do prazo
            } else if (vd1Done && vd2Done && (!vd1OnTime || !vd2OnTime)) {
                updates.b4Status = 'YELLOW'; // Ambas as visitas feitas mas fora do prazo
            } else if (vd1Done || vd2Done) {
                updates.b4Status = 'YELLOW'; // Apenas uma visita feita
            } else {
                updates.b4Status = 'RED'; // Nenhuma visita
            }

            // Atualizar status B3 (antropometria - pelo menos 09 registros simultâneos de peso e altura até os dois anos)
            const anthropometryCount = await prisma.anthropometry.count({
                where: {
                    patientId: patient.id,
                    weight: { not: null },
                    height: { not: null },
                    measurementDate: { gte: patient.birthDate },
                },
            });

            updates.anthropometryCount = anthropometryCount;
            if (anthropometryCount >= 9) {
                updates.b3Status = 'GREEN';
            } else if (anthropometryCount >= 5) {
                updates.b3Status = 'YELLOW';
            } else {
                updates.b3Status = 'RED';
            }

            if (Object.keys(updates).length > 0) {
                await prisma.childcare_indicators.update({
                    where: { patientId: patient.id },
                    data: updates,
                });
                console.log('[HomeVisitService] Indicadores de criança atualizados:', updates);
            }
        }

        // Atualizar indicadores de pré-natal (C3)
        if (patient.prenatal_data?.prenatal_indicators) {
            const updates: any = {};

            // Visitas domiciliares - C4 requer 03 visitas durante gestação + 01 no puerpério
            const gestationStart = new Date(patient.prenatal_data.lastMenstrualDate);
            const expectedDelivery = new Date(patient.prenatal_data.expectedDeliveryDate);
            const visitDateObj = new Date(visitDate);
            
            // Se é visita específica de gestante, registrar
            if (visitType === 'PREGNANT_VD1' && !patient.prenatal_data.prenatal_indicators.vd1Date) {
                updates.vd1Date = visitDate;
                console.log('[HomeVisitService] Visita registrada como VD1 de gestante (tipo específico)');
            } else if (visitType === 'PREGNANT_VD2' && !patient.prenatal_data.prenatal_indicators.vd2Date) {
                updates.vd2Date = visitDate;
                console.log('[HomeVisitService] Visita registrada como VD2 de gestante (tipo específico)');
            } else if (visitType === 'PREGNANT_VD3' && !patient.prenatal_data.prenatal_indicators.vd3Date) {
                updates.vd3Date = visitDate;
                console.log('[HomeVisitService] Visita registrada como VD3 de gestante (tipo específico)');
            } else if (visitType === 'POSTPARTUM_VD' && !patient.prenatal_data.prenatal_indicators.vdPostpartumDate) {
                updates.vdPostpartumDate = visitDate;
                console.log('[HomeVisitService] Visita registrada como VD puerpério (tipo específico)');
            }
            // Se é visita de rotina/busca ativa, contar como visita de gestante
            else if (visitType === 'ROUTINE' || visitType === 'ACTIVE_SEARCH') {
                // Verificar se está durante a gestação ou puerpério
                const fortyTwoDaysAfterDelivery = new Date(expectedDelivery.getTime() + 42 * 24 * 60 * 60 * 1000);
                
                if (visitDateObj <= expectedDelivery) {
                    // Durante a gestação - contar como VD1, VD2 ou VD3
                    if (!patient.prenatal_data.prenatal_indicators.vd1Date) {
                        updates.vd1Date = visitDate;
                        console.log('[HomeVisitService] ✅ Visita de rotina contada como VD1 de gestante');
                    } else if (!patient.prenatal_data.prenatal_indicators.vd2Date) {
                        updates.vd2Date = visitDate;
                        console.log('[HomeVisitService] ✅ Visita de rotina contada como VD2 de gestante');
                    } else if (!patient.prenatal_data.prenatal_indicators.vd3Date) {
                        updates.vd3Date = visitDate;
                        console.log('[HomeVisitService] ✅ Visita de rotina contada como VD3 de gestante');
                    }
                } else if (visitDateObj <= fortyTwoDaysAfterDelivery && !patient.prenatal_data.prenatal_indicators.vdPostpartumDate) {
                    // Puerpério (até 42 dias após parto)
                    updates.vdPostpartumDate = visitDate;
                    console.log('[HomeVisitService] ✅ Visita de rotina contada como VD puerpério');
                } else if (visitDateObj > fortyTwoDaysAfterDelivery && !patient.prenatal_data.prenatal_indicators.vdPostpartumDate) {
                    console.log('[HomeVisitService] ⚠️ Visita FORA DO PRAZO do puerpério - ACS perdeu o ponto do indicador C4');
                }
            }

            // Recalcular status C4 sempre
            const vd1Done = updates.vd1Date || patient.prenatal_data.prenatal_indicators.vd1Date;
            const vd2Done = updates.vd2Date || patient.prenatal_data.prenatal_indicators.vd2Date;
            const vd3Done = updates.vd3Date || patient.prenatal_data.prenatal_indicators.vd3Date;
            const vdPostpartumDone = updates.vdPostpartumDate || patient.prenatal_data.prenatal_indicators.vdPostpartumDate;

            const completedVisits = [vd1Done, vd2Done, vd3Done, vdPostpartumDone].filter(Boolean).length;

            if (completedVisits === 4) {
                updates.c4Status = 'GREEN';
            } else if (completedVisits >= 2) {
                updates.c4Status = 'YELLOW';
            } else {
                updates.c4Status = 'RED';
            }

            // Atualizar status C2 (pressão arterial - pelo menos 07 aferições durante a gestação)
            const bpCount = await prisma.blood_pressure.count({
                where: {
                    patientId: patient.id,
                    measurementDate: { gte: patient.prenatal_data.lastMenstrualDate },
                },
            });

            updates.bloodPressureCount = bpCount;
            if (bpCount >= 7) {
                updates.c2Status = 'GREEN';
            } else if (bpCount >= 4) {
                updates.c2Status = 'YELLOW';
            } else {
                updates.c2Status = 'RED';
            }

            // Atualizar status C3 (antropometria - pelo menos 07 registros simultâneos de peso e altura durante a gestação)
            const anthropometryCount = await prisma.anthropometry.count({
                where: {
                    patientId: patient.id,
                    weight: { not: null },
                    height: { not: null },
                    measurementDate: { gte: patient.prenatal_data.lastMenstrualDate },
                },
            });

            if (anthropometryCount >= 7) {
                updates.c3Status = 'GREEN';
                updates.weightHeightRecorded = true;
            } else if (anthropometryCount >= 4) {
                updates.c3Status = 'YELLOW';
                updates.weightHeightRecorded = true;
            } else {
                updates.c3Status = 'RED';
                updates.weightHeightRecorded = false;
            }

            if (Object.keys(updates).length > 0) {
                await prisma.prenatal_indicators.update({
                    where: { prenatalDataId: patient.prenatal_data.id },
                    data: updates,
                });
                console.log('[HomeVisitService] Indicadores de gestante atualizados:', updates);
            }
        }

        // Atualizar indicadores de diabetes (C4)
        if (patient.diabetes_indicators) {
            const updates: any = {};

            // Atualizar D4 (visitas domiciliares - pelo menos 02 visitas com intervalo mínimo de 30 dias nos últimos 12 meses)
            const visitsLast12Months = await prisma.home_visits.count({
                where: {
                    patientId: patient.id,
                    visitDate: { gte: twelveMonthsAgo },
                },
            });

            updates.visitCountLast12Months = visitsLast12Months;
            if (visitsLast12Months >= 2) {
                updates.d4Status = 'GREEN';
            } else if (visitsLast12Months === 1) {
                updates.d4Status = 'YELLOW';
            } else {
                updates.d4Status = 'RED';
            }

            // Atualizar status D2 (pressão arterial - pelo menos 01 registro nos últimos 06 meses)
            const lastBP = await prisma.blood_pressure.findFirst({
                where: {
                    patientId: patient.id,
                    measurementDate: { gte: sixMonthsAgo },
                },
                orderBy: { measurementDate: 'desc' },
            });

            if (lastBP) {
                updates.lastBloodPressureDate = lastBP.measurementDate;
                updates.d2Status = 'GREEN';
            } else {
                updates.d2Status = 'RED';
            }

            // Atualizar status D3 (antropometria - pelo menos 01 registro de peso e altura nos últimos 12 meses)
            const lastAnthropometry = await prisma.anthropometry.findFirst({
                where: {
                    patientId: patient.id,
                    weight: { not: null },
                    height: { not: null },
                    measurementDate: { gte: twelveMonthsAgo },
                },
                orderBy: { measurementDate: 'desc' },
            });

            if (lastAnthropometry) {
                updates.lastAnthropometryDate = lastAnthropometry.measurementDate;
                updates.d3Status = 'GREEN';
            } else {
                updates.d3Status = 'RED';
            }

            if (Object.keys(updates).length > 0) {
                await prisma.diabetes_indicators.update({
                    where: { patientId: patient.id },
                    data: updates,
                });
                console.log('[HomeVisitService] Indicadores de diabetes atualizados:', updates);
            }
        }

        // Atualizar indicadores de hipertensão (C5)
        if (patient.hypertension_indicators) {
            const updates: any = {};

            // Atualizar E4 (visitas domiciliares - pelo menos 02 visitas com intervalo mínimo de 30 dias nos últimos 12 meses)
            const visitsLast12Months = await prisma.home_visits.count({
                where: {
                    patientId: patient.id,
                    visitDate: { gte: twelveMonthsAgo },
                },
            });

            updates.visitCountLast12Months = visitsLast12Months;
            if (visitsLast12Months >= 2) {
                updates.e4Status = 'GREEN';
            } else if (visitsLast12Months === 1) {
                updates.e4Status = 'YELLOW';
            } else {
                updates.e4Status = 'RED';
            }

            // Atualizar status E2 (pressão arterial - pelo menos 01 registro nos últimos 06 meses)
            const lastBP = await prisma.blood_pressure.findFirst({
                where: {
                    patientId: patient.id,
                    measurementDate: { gte: sixMonthsAgo },
                },
                orderBy: { measurementDate: 'desc' },
            });

            if (lastBP) {
                updates.lastBloodPressureDate = lastBP.measurementDate;
                updates.e2Status = 'GREEN';
            } else {
                updates.e2Status = 'RED';
            }

            // Atualizar status E3 (antropometria - pelo menos 01 registro simultâneo de peso e altura nos últimos 12 meses)
            const lastAnthropometry = await prisma.anthropometry.findFirst({
                where: {
                    patientId: patient.id,
                    weight: { not: null },
                    height: { not: null },
                    measurementDate: { gte: twelveMonthsAgo },
                },
                orderBy: { measurementDate: 'desc' },
            });

            if (lastAnthropometry) {
                updates.lastAnthropometryDate = lastAnthropometry.measurementDate;
                updates.e3Status = 'GREEN';
            } else {
                updates.e3Status = 'RED';
            }

            if (Object.keys(updates).length > 0) {
                await prisma.hypertension_indicators.update({
                    where: { patientId: patient.id },
                    data: updates,
                });
                console.log('[HomeVisitService] Indicadores de hipertensão atualizados:', updates);
            }
        }

        // Atualizar indicadores de idoso (C6)
        if (patient.elderly_indicators) {
            const updates: any = {};

            // Atualizar C3 (visitas domiciliares - pelo menos 02 visitas com intervalo mínimo de 30 dias nos últimos 12 meses)
            const visitsLast12Months = await prisma.home_visits.count({
                where: {
                    patientId: patient.id,
                    visitDate: { gte: twelveMonthsAgo },
                },
            });

            updates.visitCountLast12Months = visitsLast12Months;
            if (visitsLast12Months >= 2) {
                updates.c3Status = 'GREEN';
            } else if (visitsLast12Months === 1) {
                updates.c3Status = 'YELLOW';
            } else {
                updates.c3Status = 'RED';
            }

            // Atualizar B (antropometria - pelo menos 01 registro simultâneo de peso e altura nos últimos 12 meses)
            const lastAnthropometry = await prisma.anthropometry.findFirst({
                where: {
                    patientId: patient.id,
                    weight: { not: null },
                    height: { not: null },
                    measurementDate: { gte: twelveMonthsAgo },
                },
                orderBy: { measurementDate: 'desc' },
            });

            if (lastAnthropometry) {
                updates.lastAnthropometryDate = lastAnthropometry.measurementDate;
                updates.bStatus = 'GREEN';
                console.log('[HomeVisitService] ✅ Idoso tem antropometria atualizada - Indicador B GREEN');
            } else {
                updates.bStatus = 'RED';
                console.log('[HomeVisitService] ❌ Idoso precisa de antropometria - Indicador B RED');
            }

            if (Object.keys(updates).length > 0) {
                await prisma.elderly_indicators.update({
                    where: { patientId: patient.id },
                    data: updates,
                });
                console.log('[HomeVisitService] Indicadores de idoso atualizados:', updates);
            }
        }

        console.log('[HomeVisitService] Atualização de indicadores concluída');
    }

    private formatHomeVisitResponse(homeVisit: any) {
        return {
            id: homeVisit.id,
            patient: homeVisit.patients, // Corrigido: patients é o nome da relação
            acs: homeVisit.users,
            visitDate: homeVisit.visitDate,
            visitType: homeVisit.visitType,
            purpose: homeVisit.purpose,
            observations: homeVisit.observations,
            location: homeVisit.latitude && homeVisit.longitude ? {
                latitude: homeVisit.latitude,
                longitude: homeVisit.longitude,
            } : null,
            createdAt: homeVisit.createdAt,
            updatedAt: homeVisit.updatedAt,
        };
    }
}



