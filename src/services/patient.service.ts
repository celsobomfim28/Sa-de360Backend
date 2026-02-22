import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { CreatePatientInput, UpdatePatientInput } from '../validators/patient.validator';

export class PatientService {
    async create(data: CreatePatientInput, createdById: string) {
        const { address, eligibilityCriteria, ...patientData } = data;

        // Remover formatação do CPF
        const cleanCpf = patientData.cpf.replace(/\D/g, '');

        // Limpar CNS (remover espaços e formatação)
        const cleanCns = patientData.cns ? patientData.cns.replace(/\D/g, '') : undefined;

        // Calcular idade para marcar automaticamente "isChild" e "isElderly"
        const birthDate = new Date(patientData.birthDate);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        const ageInYears = Math.floor(ageInMonths / 12);

        const isChild = ageInMonths < 24;
        const isElderly = ageInYears >= 60;
        const isWoman = patientData.sex === 'FEMALE' && ageInYears >= 9 && ageInYears <= 69;

        // Preparar dados para criação, removendo campos vazios opcionais
        const createData: any = {
            ...patientData,
            cpf: cleanCpf,
            cns: cleanCns || undefined,
            motherName: patientData.motherName || undefined,
            primaryPhone: patientData.primaryPhone || undefined,
            secondaryPhone: patientData.secondaryPhone || undefined,
            email: patientData.email || undefined,
            ...address,
            complement: address.complement || undefined,
            zipCode: address.zipCode || undefined,
            referencePoint: address.referencePoint || undefined,
            ...eligibilityCriteria,
            lastMenstrualDate: eligibilityCriteria.lastMenstrualDate || undefined,
            deliveryDate: eligibilityCriteria.deliveryDate || undefined,
            hypertensionDiagnosisDate: eligibilityCriteria.hypertensionDiagnosisDate || undefined,
            diabetesDiagnosisDate: eligibilityCriteria.diabetesDiagnosisDate || undefined,
            isChild: isChild || eligibilityCriteria.isChild,
            isElderly: isElderly || eligibilityCriteria.isElderly,
            isWoman: isWoman || eligibilityCriteria.isWoman,
            createdById,
        };

        // Criar paciente
        const patient = await prisma.patients.create({
            data: createData,
            include: {
                micro_areas: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
        });

        // Se for gestante, criar dados de pré-natal
        if (eligibilityCriteria.isPregnant && eligibilityCriteria.lastMenstrualDate) {
            const lastMenstrualDate = new Date(eligibilityCriteria.lastMenstrualDate);
            const expectedDeliveryDate = new Date(lastMenstrualDate);
            expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 280); // DPP = DUM + 280 dias

            const gestationalAge = Math.floor((today.getTime() - lastMenstrualDate.getTime()) / (1000 * 60 * 60 * 24));

            const prenatalData = await prisma.prenatal_data.create({
                data: {
                    patientId: patient.id,
                    lastMenstrualDate,
                    expectedDeliveryDate,
                    gestationalAge,
                    isHighRisk: false,
                    previousPregnancies: 0,
                    previousDeliveries: 0,
                    previousAbortions: 0,
                },
            });

            // Criar indicador de pré-natal
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
        }

        // Se for criança, criar indicador de puericultura
        if (isChild) {
            await prisma.childcare_indicators.create({
                data: {
                    patientId: patient.id,
                    b1Status: 'RED',
                    b2Status: 'RED',
                    b3Status: 'RED',
                    b4Status: 'RED',
                    vaccineStatus: 'NOT_STARTED',
                    b5Status: 'RED',
                },
            });
        }

        // Se for diabético, criar indicador de diabetes
        if (eligibilityCriteria.hasDiabetes) {
            await prisma.diabetes_indicators.create({
                data: {
                    patientId: patient.id,
                    d1Status: 'RED',
                    d2Status: 'RED',
                    d3Status: 'RED',
                    d4Status: 'RED',
                    d5Status: 'RED',
                    d6Status: 'RED',
                },
            });
        }

        // Se for hipertenso, criar indicador de hipertensão
        if (eligibilityCriteria.hasHypertension) {
            await prisma.hypertension_indicators.create({
                data: {
                    patientId: patient.id,
                    e1Status: 'RED',
                    e2Status: 'RED',
                    e3Status: 'RED',
                    e4Status: 'RED',
                },
            });
        }

        // Se for idoso, criar indicador de idoso
        if (isElderly) {
            await prisma.elderly_indicators.create({
                data: {
                    patientId: patient.id,
                    f1Status: 'RED',
                    f2Status: 'RED',
                },
            });
        }

        // Se for mulher (9-69 anos), criar indicador de saúde da mulher
        if (isWoman) {
            await prisma.woman_health_indicators.create({
                data: {
                    patientId: patient.id,
                    g1Status: 'RED',
                    g2Status: 'RED',
                },
            });
        }

        return this.formatPatientResponse(patient);
    }

    async list(filters: {
        name?: string;
        cpf?: string;
        cns?: string;
        microAreaId?: string;
        agentId?: string;
        eligibilityGroup?: string;
        status?: string;
        ageMin?: number;
        ageMax?: number;
        page: number;
        limit: number;
    }) {
        const { name, cpf, cns, microAreaId, agentId, eligibilityGroup, status, ageMin, ageMax, page, limit } = filters;

        const where: any = {
            deletedAt: status === 'INACTIVE' ? { not: null } : null,
        };

        if (name) {
            where.fullName = { contains: name, mode: 'insensitive' };
        }

        if (cpf) {
            where.cpf = cpf.replace(/\D/g, '');
        }

        if (cns) {
            where.cns = cns;
        }

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        // Filtro por agente: buscar microárea do agente
        if (agentId) {
            const agent = await prisma.users.findUnique({
                where: { id: agentId },
                select: { microAreaId: true }
            });
            
            if (agent?.microAreaId) {
                where.microAreaId = agent.microAreaId;
            }
        }

        // Filtro por grupo de elegibilidade
        if (eligibilityGroup) {
            switch (eligibilityGroup) {
                case 'CHILD':
                    where.isChild = true;
                    break;
                case 'PREGNANT':
                    where.isPregnant = true;
                    break;
                case 'POSTPARTUM':
                    where.isPostpartum = true;
                    break;
                case 'HYPERTENSION':
                    where.hasHypertension = true;
                    break;
                case 'DIABETES':
                    where.hasDiabetes = true;
                    break;
                case 'ELDERLY':
                    where.isElderly = true;
                    break;
                case 'WOMAN':
                    where.isWoman = true;
                    break;
            }
        }

        // Filtro por idade
        if (ageMin !== undefined || ageMax !== undefined) {
            const today = new Date();
            
            if (ageMax !== undefined) {
                const minBirthDate = new Date(today.getFullYear() - ageMax - 1, today.getMonth(), today.getDate());
                where.birthDate = { ...where.birthDate, gte: minBirthDate };
            }
            
            if (ageMin !== undefined) {
                const maxBirthDate = new Date(today.getFullYear() - ageMin, today.getMonth(), today.getDate());
                where.birthDate = { ...where.birthDate, lte: maxBirthDate };
            }
        }

        const [patients, total] = await Promise.all([
            prisma.patients.findMany({
                where,
                include: {
                    micro_areas: {
                        select: {
                            id: true,
                            name: true,
                            users: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                        },
                    },
                    diabetes_indicators: true,
                    hypertension_indicators: true,
                    prenatal_data: {
                        include: {
                            prenatal_indicators: true,
                        },
                    },
                    childcare_indicators: true,
                    elderly_indicators: true,
                    woman_health_indicators: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.patients.count({ where }),
        ]);

        return {
            data: patients.map((p: any) => this.formatPatientListItem(p)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: string) {
        const patient = await prisma.patients.findUnique({
            where: { id },
            include: {
                micro_areas: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                },
                prenatal_data: {
                    include: {
                        prenatal_indicators: true,
                    },
                },
                childcare_indicators: true,
                diabetes_indicators: true,
                elderly_indicators: true,
                hypertension_indicators: true,
                woman_health_indicators: true,
            },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'NOT_FOUND');
        }

        return this.formatPatientResponse(patient);
    }

    async update(id: string, data: UpdatePatientInput) {
        const patient = await prisma.patients.findUnique({ where: { id } });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'NOT_FOUND');
        }

        const { address, eligibilityCriteria, ...patientData } = data;

        const updated = await prisma.patients.update({
            where: { id },
            data: {
                ...patientData,
                ...address,
                ...eligibilityCriteria,
            },
            include: {
                micro_areas: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
        });

        return this.formatPatientResponse(updated);
    }

    async delete(id: string) {
        const patient = await prisma.patients.findUnique({ where: { id } });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'NOT_FOUND');
        }

        await prisma.patients.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async getTimeline(id: string) {
        try {
            const [
                appointments,
                homeVisits,
                vaccines,
                prenatalConsultations,
                postpartumConsultations,
                childcareConsultations,
            ] = await Promise.all([
                prisma.appointments.findMany({
                    where: { patientId: id },
                    include: { users: { select: { fullName: true, role: true } } },
                    orderBy: { scheduledDate: 'desc' },
                }).catch(() => []),
                prisma.home_visits.findMany({
                    where: { patientId: id },
                    include: { users: { select: { fullName: true } } },
                    orderBy: { visitDate: 'desc' },
                }).catch(() => []),
                prisma.vaccine_records.findMany({
                    where: { patientId: id },
                    include: { vaccines: true, users: { select: { fullName: true } } },
                    orderBy: { applicationDate: 'desc' },
                }).catch(() => []),
                prisma.prenatal_consultations.findMany({
                    where: { prenatal_data: { patientId: id } },
                    include: { users: { select: { fullName: true, role: true } } },
                    orderBy: { consultationDate: 'desc' },
                }).catch(() => []),
                prisma.postpartum_consultations.findMany({
                    where: { patientId: id },
                    include: { users: { select: { fullName: true, role: true } } },
                    orderBy: { consultationDate: 'desc' },
                }).catch(() => []),
                prisma.childcare_consultations.findMany({
                    where: { patientId: id },
                    include: { users: { select: { fullName: true, role: true } } },
                    orderBy: { consultationDate: 'desc' },
                }).catch(() => []),
            ]);

            const events = [
                ...appointments.map((a: any) => ({
                    type: 'APPOINTMENT',
                    date: a.scheduledDate,
                    title: `Consulta: ${a.type}`,
                    description: a.observations,
                    status: a.status,
                    professional: a.users?.fullName || 'Não informado',
                })),
                ...homeVisits.map((v: any) => ({
                    type: 'HOME_VISIT',
                    date: v.visitDate,
                    title: `Visita Domiciliar: ${v.visitType}`,
                    description: v.purpose,
                    professional: v.users?.fullName || 'Não informado',
                })),
                ...vaccines.map((v: any) => ({
                    type: 'VACCINE',
                    date: v.applicationDate,
                    title: `Vacina: ${v.vaccines?.name || 'Vacina'}`,
                    description: `${v.dose}ª Dose`,
                    professional: v.users?.fullName || 'Não informado',
                })),
                ...prenatalConsultations.map((c: any) => ({
                    type: 'PRENATAL_CONSULTATION',
                    date: c.consultationDate,
                    title: 'Consulta Pré-natal',
                    description: `IG: ${c.gestationalAge} semanas`,
                    professional: c.users?.fullName || 'Não informado',
                })),
                ...postpartumConsultations.map((c: any) => ({
                    type: 'POSTPARTUM_CONSULTATION',
                    date: c.consultationDate,
                    title: 'Consulta Puerpério',
                    professional: c.users?.fullName || 'Não informado',
                })),
                ...childcareConsultations.map((c: any) => ({
                    type: 'CHILDCARE_CONSULTATION',
                    date: c.consultationDate,
                    title: 'Consulta Puericultura',
                    professional: c.users?.fullName || 'Não informado',
                })),
            ].sort((a, b) => b.date.getTime() - a.date.getTime());

            return {
                patientId: id,
                events,
            };
        } catch (error) {
            console.error('Erro ao buscar timeline:', error);
            return {
                patientId: id,
                events: [],
            };
        }
    }

    async getIndicators(id: string) {
        const patient = await prisma.patients.findUnique({
            where: { id },
            include: {
                prenatal_data: {
                    include: { prenatal_indicators: true },
                },
                childcare_indicators: true,
                diabetes_indicators: true,
                hypertension_indicators: true,
                elderly_indicators: true,
                woman_health_indicators: true,
            },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        const indicators: any = {};
        let green = 0;
        let yellow = 0;
        let red = 0;

        const countStatus = (status: string) => {
            if (status === 'GREEN') green++;
            else if (status === 'YELLOW') yellow++;
            else if (status === 'RED') red++;
        };

        // Indicadores de Pré-natal
        if (patient.prenatal_data?.prenatal_indicators) {
            const ind = patient.prenatal_data.prenatal_indicators;
            indicators.prenatal = ind;
            countStatus(ind.c1Status);
            countStatus(ind.c2Status);
            countStatus(ind.c3Status);
            countStatus(ind.c4Status);
            countStatus(ind.c5Status);
            countStatus(ind.c6Status);
        }

        // Indicadores de Puericultura
        if (patient.childcare_indicators) {
            const ind = patient.childcare_indicators;
            indicators.childcare = ind;
            countStatus(ind.b1Status);
            countStatus(ind.b2Status);
            countStatus(ind.b3Status);
            countStatus(ind.b4Status);
            countStatus(ind.b5Status);
        }

        // Indicadores de Diabetes
        if (patient.diabetes_indicators) {
            const ind = patient.diabetes_indicators;
            indicators.diabetes = ind;
            countStatus(ind.d1Status);
            countStatus(ind.d2Status);
            countStatus(ind.d3Status);
            countStatus(ind.d4Status);
            countStatus(ind.d5Status);
            countStatus(ind.d6Status);
        }

        // Indicadores de Hipertensão
        if (patient.hypertension_indicators) {
            const ind = patient.hypertension_indicators;
            indicators.hypertension = ind;
            countStatus(ind.e1Status);
            countStatus(ind.e2Status);
            countStatus(ind.e3Status);
            countStatus(ind.e4Status);
        }

        // Indicadores de Idosos
        if (patient.elderly_indicators) {
            const ind = patient.elderly_indicators;
            indicators.elderly = ind;
            countStatus(ind.f1Status);
            countStatus(ind.f2Status);
            countStatus(ind.f3Status);
            countStatus(ind.f4Status);
        }

        // Indicadores de Saúde da Mulher
        if (patient.woman_health_indicators) {
            const ind = patient.woman_health_indicators;
            indicators.womanHealth = ind;
            countStatus(ind.g1Status);
            countStatus(ind.g2Status);
        }

        return {
            patientId: id,
            indicators,
            summary: {
                green,
                yellow,
                red,
            },
        };
    }

    private formatPatientResponse(patient: any) {
        const birthDate = new Date(patient.birthDate);
        const today = new Date();
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

        const eligibilityGroups = [];
        if (patient.isChild) eligibilityGroups.push('CHILD');
        if (patient.isPregnant) eligibilityGroups.push('PREGNANT');
        if (patient.isPostpartum) eligibilityGroups.push('POSTPARTUM');
        if (patient.hasHypertension) eligibilityGroups.push('HYPERTENSION');
        if (patient.hasDiabetes) eligibilityGroups.push('DIABETES');
        if (patient.isElderly) eligibilityGroups.push('ELDERLY');
        if (patient.isWoman) eligibilityGroups.push('WOMAN');

        return {
            id: patient.id,
            cpf: this.formatCpf(patient.cpf),
            cns: patient.cns,
            fullName: patient.fullName,
            birthDate: patient.birthDate,
            age,
            sex: patient.sex,
            motherName: patient.motherName,
            address: {
                street: patient.street,
                number: patient.number,
                complement: patient.complement,
                neighborhood: patient.neighborhood,
                zipCode: patient.zipCode,
                referencePoint: patient.referencePoint,
            },
            microArea: patient.micro_areas,
            primaryPhone: patient.primaryPhone,
            secondaryPhone: patient.secondaryPhone,
            email: patient.email,
            eligibilityGroups,
            // Campos de elegibilidade individuais
            isChild: patient.isChild,
            isPregnant: patient.isPregnant,
            isPostpartum: patient.isPostpartum,
            hasHypertension: patient.hasHypertension,
            hasDiabetes: patient.hasDiabetes,
            isElderly: patient.isElderly,
            isWoman: patient.isWoman,
            hypertensionDiagnosisDate: patient.hypertensionDiagnosisDate,
            diabetesDiagnosisDate: patient.diabetesDiagnosisDate,
            prenatalData: patient.prenatal_data,
            // Indicadores
            childcareIndicators: patient.childcare_indicators,
            diabetesIndicators: patient.diabetes_indicators,
            elderlyIndicators: patient.elderly_indicators,
            hypertensionIndicators: patient.hypertension_indicators,
            womanHealthIndicators: patient.woman_health_indicators,
            prenatalIndicators: patient.prenatal_data?.prenatal_indicators,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
            deletedAt: patient.deletedAt,
        };
    }

    private formatPatientListItem(patient: any) {
        const birthDate = new Date(patient.birthDate);
        const today = new Date();
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

        const eligibilityGroups = [];
        if (patient.isChild) eligibilityGroups.push('CHILD');
        if (patient.isPregnant) eligibilityGroups.push('PREGNANT');
        if (patient.isPostpartum) eligibilityGroups.push('POSTPARTUM');
        if (patient.hasHypertension) eligibilityGroups.push('HYPERTENSION');
        if (patient.hasDiabetes) eligibilityGroups.push('DIABETES');
        if (patient.isElderly) eligibilityGroups.push('ELDERLY');
        if (patient.isWoman) eligibilityGroups.push('WOMAN');

        // Calcular resumo de indicadores
        let red = 0, yellow = 0, green = 0;

        // Contar indicadores de diabetes
        if (patient.diabetes_indicators) {
            const d = patient.diabetes_indicators;
            ['d1Status', 'd2Status', 'd3Status', 'd4Status', 'd5Status', 'd6Status'].forEach(field => {
                if (d[field] === 'RED') red++;
                else if (d[field] === 'YELLOW') yellow++;
                else if (d[field] === 'GREEN') green++;
            });
        }

        // Contar indicadores de hipertensão
        if (patient.hypertension_indicators) {
            const h = patient.hypertension_indicators;
            ['e1Status', 'e2Status', 'e3Status', 'e4Status'].forEach(field => {
                if (h[field] === 'RED') red++;
                else if (h[field] === 'YELLOW') yellow++;
                else if (h[field] === 'GREEN') green++;
            });
        }

        // Contar indicadores de pré-natal
        if (patient.prenatal_data?.prenatal_indicators) {
            const p = patient.prenatal_data.prenatal_indicators;
            ['c1Status', 'c2Status', 'c3Status', 'c4Status', 'c5Status', 'c6Status'].forEach(field => {
                if (p[field] === 'RED') red++;
                else if (p[field] === 'YELLOW') yellow++;
                else if (p[field] === 'GREEN') green++;
            });
        }

        // Contar indicadores de puericultura
        if (patient.childcare_indicators) {
            const c = patient.childcare_indicators;
            ['b1Status', 'b2Status', 'b3Status', 'b4Status', 'b5Status'].forEach(field => {
                if (c[field] === 'RED') red++;
                else if (c[field] === 'YELLOW') yellow++;
                else if (c[field] === 'GREEN') green++;
            });
        }

        // Contar indicadores de idoso
        if (patient.elderly_indicators) {
            const e = patient.elderly_indicators;
            ['f1Status', 'f2Status'].forEach(field => {
                if (e[field] === 'RED') red++;
                else if (e[field] === 'YELLOW') yellow++;
                else if (e[field] === 'GREEN') green++;
            });
        }

        // Contar indicadores de saúde da mulher
        if (patient.woman_health_indicators) {
            const w = patient.woman_health_indicators;
            ['g1Status', 'g2Status'].forEach(field => {
                if (w[field] === 'RED') red++;
                else if (w[field] === 'YELLOW') yellow++;
                else if (w[field] === 'GREEN') green++;
            });
        }

        return {
            id: patient.id,
            fullName: patient.fullName,
            age,
            birthDate: patient.birthDate,
            cpf: this.formatCpf(patient.cpf),
            microArea: patient.micro_areas,
            eligibilityGroups,
            lastConsultation: null,
            indicatorsSummary: {
                green,
                yellow,
                red,
            },
        };
    }

    private formatCpf(cpf: string): string {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
}

