import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export class ManagementService {
    async getGeneralStats(microAreaId?: string, agentId?: string) {
        let effectiveMicroAreaId = microAreaId;

        // Se filtrar por agente, busca a microárea dele
        if (agentId) {
            const agent = await prisma.users.findUnique({
                where: { id: agentId },
                select: { microAreaId: true }
            });
            if (agent?.microAreaId) {
                effectiveMicroAreaId = agent.microAreaId;
            }
        }

        const where: any = { deletedAt: null };
        if (effectiveMicroAreaId) {
            where.microAreaId = effectiveMicroAreaId;
        }

        const totalPatients = await prisma.patients.count({ where });

        // Programs counts
        const [
            diabetesCount,
            hypertensionCount,
            elderlyCount,
            pregnantCount,
            childCount
        ] = await Promise.all([
            prisma.patients.count({ where: { ...where, hasDiabetes: true } }),
            prisma.patients.count({ where: { ...where, hasHypertension: true } }),
            prisma.patients.count({ where: { ...where, isElderly: true } }),
            prisma.patients.count({ where: { ...where, isPregnant: true } }),
            prisma.patients.count({ where: { ...where, isChild: true } })
        ]);

        // Indicator summaries
        const whereIndicator: any = effectiveMicroAreaId ? { patients: { microAreaId: effectiveMicroAreaId } } : {};
        const wherePrenatalIndicator: any = effectiveMicroAreaId ? { prenatal_data: { patients: { microAreaId: effectiveMicroAreaId } } } : {};

        const [
            diabetesIndicators,
            hypertensionIndicators,
            prenatalIndicators,
            childcareIndicators,
            elderlyIndicators
        ] = await Promise.all([
            prisma.diabetes_indicators.groupBy({
                by: ['d1Status'],
                where: whereIndicator,
                _count: true
            }),
            prisma.hypertension_indicators.groupBy({
                by: ['e1Status'],
                where: whereIndicator,
                _count: true
            }),
            prisma.prenatal_indicators.groupBy({
                by: ['c1Status'],
                where: wherePrenatalIndicator,
                _count: true
            }),
            prisma.childcare_indicators.groupBy({
                by: ['b1Status'],
                where: whereIndicator,
                _count: true
            }),
            prisma.elderly_indicators.groupBy({
                by: ['f1Status'],
                where: whereIndicator,
                _count: true
            })
        ]);

        return {
            totalPatients,
            microAreaId: effectiveMicroAreaId,
            programs: {
                diabetes: diabetesCount,
                hypertension: hypertensionCount,
                elderly: elderlyCount,
                pregnant: pregnantCount,
                children: childCount
            },
            indicatorSummary: {
                diabetes: diabetesIndicators,
                hypertension: hypertensionIndicators,
                prenatal: prenatalIndicators,
                childcare: childcareIndicators,
                elderly: elderlyIndicators
            }
        };
    }

    async getPriorityList(microAreaId?: string, agentId?: string, indicatorId?: string) {
        let effectiveMicroAreaId = microAreaId;

        if (agentId) {
            const agent = await prisma.users.findUnique({
                where: { id: agentId },
                select: { microAreaId: true }
            });
            if (agent?.microAreaId) {
                effectiveMicroAreaId = agent.microAreaId;
            }
        }

        const where: any = { deletedAt: null };
        if (effectiveMicroAreaId) {
            where.microAreaId = effectiveMicroAreaId;
        }

        // Tipo para paciente com todos os indicadores incluídos
        type PatientWithIndicators = Prisma.patientsGetPayload<{
            include: {
                prenatal_data: {
                    include: {
                        prenatal_indicators: true;
                    };
                };
                childcare_indicators: true;
                diabetes_indicators: true;
                hypertension_indicators: true;
                elderly_indicators: true;
                woman_health_indicators: true;
                micro_areas: { select: { name: true } };
            };
        }>;

        // Buscar TODOS os pacientes elegíveis (com indicadores)
        const priorityPatients: PatientWithIndicators[] = await prisma.patients.findMany({
            where,
            include: {
                prenatal_data: {
                    include: {
                        prenatal_indicators: true
                    }
                },
                childcare_indicators: true,
                diabetes_indicators: true,
                hypertension_indicators: true,
                elderly_indicators: true,
                woman_health_indicators: true,
                micro_areas: { select: { name: true } }
            },
            orderBy: { fullName: 'asc' }
        });

        // Filtrar apenas pacientes com indicadores RED ou YELLOW
        const filteredPatients = priorityPatients.filter(p => {
            // Se um indicador específico foi solicitado, filtrar apenas por ele
            if (indicatorId) {
                switch(indicatorId) {
                    case 'D1':
                    case 'D2':
                    case 'D3':
                    case 'D4':
                    case 'D5':
                    case 'D6':
                        if (!p.diabetes_indicators) return false;
                        const dField = `${indicatorId.toLowerCase()}Status` as keyof typeof p.diabetes_indicators;
                        return p.diabetes_indicators[dField] === 'RED' || p.diabetes_indicators[dField] === 'YELLOW';
                    
                    case 'E1':
                    case 'E2':
                    case 'E3':
                    case 'E4':
                        if (!p.hypertension_indicators) return false;
                        const eField = `${indicatorId.toLowerCase()}Status` as keyof typeof p.hypertension_indicators;
                        return p.hypertension_indicators[eField] === 'RED' || p.hypertension_indicators[eField] === 'YELLOW';
                    
                    case 'C1':
                    case 'C2':
                    case 'C3':
                    case 'C4':
                    case 'C5':
                    case 'C6':
                        if (!p.prenatal_data?.prenatal_indicators) return false;
                        const cField = `${indicatorId.toLowerCase()}Status` as keyof typeof p.prenatal_data.prenatal_indicators;
                        return p.prenatal_data.prenatal_indicators[cField] === 'RED' || p.prenatal_data.prenatal_indicators[cField] === 'YELLOW';
                    
                    case 'B1':
                    case 'B2':
                    case 'B3':
                    case 'B4':
                    case 'B5':
                        if (!p.childcare_indicators) return false;
                        const bField = `${indicatorId.toLowerCase()}Status` as keyof typeof p.childcare_indicators;
                        return p.childcare_indicators[bField] === 'RED' || p.childcare_indicators[bField] === 'YELLOW';
                    
                    case 'F1':
                    case 'F2':
                        if (!p.elderly_indicators) return false;
                        const fField = `${indicatorId.toLowerCase()}Status` as keyof typeof p.elderly_indicators;
                        return p.elderly_indicators[fField] === 'RED' || p.elderly_indicators[fField] === 'YELLOW';
                    
                    case 'G1':
                    case 'G2':
                        if (!p.woman_health_indicators) return false;
                        const gField = `${indicatorId.toLowerCase()}Status` as keyof typeof p.woman_health_indicators;
                        return p.woman_health_indicators[gField] === 'RED' || p.woman_health_indicators[gField] === 'YELLOW';
                    
                    default:
                        return false;
                }
            }
            
            // Se nenhum indicador específico, retornar todos com RED ou YELLOW
            const hasRedOrYellow = 
                // Pré-natal
                (p.prenatal_data?.prenatal_indicators && (
                    p.prenatal_data.prenatal_indicators.c1Status === 'RED' || p.prenatal_data.prenatal_indicators.c1Status === 'YELLOW' ||
                    p.prenatal_data.prenatal_indicators.c2Status === 'RED' || p.prenatal_data.prenatal_indicators.c2Status === 'YELLOW' ||
                    p.prenatal_data.prenatal_indicators.c3Status === 'RED' || p.prenatal_data.prenatal_indicators.c3Status === 'YELLOW' ||
                    p.prenatal_data.prenatal_indicators.c4Status === 'RED' || p.prenatal_data.prenatal_indicators.c4Status === 'YELLOW' ||
                    p.prenatal_data.prenatal_indicators.c5Status === 'RED' || p.prenatal_data.prenatal_indicators.c5Status === 'YELLOW' ||
                    p.prenatal_data.prenatal_indicators.c6Status === 'RED' || p.prenatal_data.prenatal_indicators.c6Status === 'YELLOW'
                )) ||
                // Puericultura
                (p.childcare_indicators && (
                    p.childcare_indicators.b1Status === 'RED' || p.childcare_indicators.b1Status === 'YELLOW' ||
                    p.childcare_indicators.b2Status === 'RED' || p.childcare_indicators.b2Status === 'YELLOW' ||
                    p.childcare_indicators.b3Status === 'RED' || p.childcare_indicators.b3Status === 'YELLOW' ||
                    p.childcare_indicators.b4Status === 'RED' || p.childcare_indicators.b4Status === 'YELLOW' ||
                    p.childcare_indicators.b5Status === 'RED' || p.childcare_indicators.b5Status === 'YELLOW'
                )) ||
                // Diabetes
                (p.diabetes_indicators && (
                    p.diabetes_indicators.d1Status === 'RED' || p.diabetes_indicators.d1Status === 'YELLOW' ||
                    p.diabetes_indicators.d2Status === 'RED' || p.diabetes_indicators.d2Status === 'YELLOW' ||
                    p.diabetes_indicators.d3Status === 'RED' || p.diabetes_indicators.d3Status === 'YELLOW' ||
                    p.diabetes_indicators.d4Status === 'RED' || p.diabetes_indicators.d4Status === 'YELLOW' ||
                    p.diabetes_indicators.d5Status === 'RED' || p.diabetes_indicators.d5Status === 'YELLOW' ||
                    p.diabetes_indicators.d6Status === 'RED' || p.diabetes_indicators.d6Status === 'YELLOW'
                )) ||
                // Hipertensão
                (p.hypertension_indicators && (
                    p.hypertension_indicators.e1Status === 'RED' || p.hypertension_indicators.e1Status === 'YELLOW' ||
                    p.hypertension_indicators.e2Status === 'RED' || p.hypertension_indicators.e2Status === 'YELLOW' ||
                    p.hypertension_indicators.e3Status === 'RED' || p.hypertension_indicators.e3Status === 'YELLOW' ||
                    p.hypertension_indicators.e4Status === 'RED' || p.hypertension_indicators.e4Status === 'YELLOW'
                )) ||
                // Idosos
                (p.elderly_indicators && (
                    p.elderly_indicators.f1Status === 'RED' || p.elderly_indicators.f1Status === 'YELLOW' ||
                    p.elderly_indicators.f2Status === 'RED' || p.elderly_indicators.f2Status === 'YELLOW'
                )) ||
                // Saúde da Mulher
                (p.woman_health_indicators && (
                    p.woman_health_indicators.g1Status === 'RED' || p.woman_health_indicators.g1Status === 'YELLOW' ||
                    p.woman_health_indicators.g2Status === 'RED' || p.woman_health_indicators.g2Status === 'YELLOW'
                ));

            return hasRedOrYellow;
        });

        return filteredPatients.slice(0, 100).map(p => {
            const birthDate = new Date(p.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Coletar todos os indicadores críticos (RED) e de atenção (YELLOW)
            const criticalIndicators: string[] = [];
            
            // Pré-natal (C1-C6)
            if (p.prenatal_data?.prenatal_indicators) {
                if (p.prenatal_data.prenatal_indicators.c1Status === 'RED') criticalIndicators.push('C1');
                if (p.prenatal_data.prenatal_indicators.c2Status === 'RED') criticalIndicators.push('C2');
                if (p.prenatal_data.prenatal_indicators.c3Status === 'RED') criticalIndicators.push('C3');
                if (p.prenatal_data.prenatal_indicators.c4Status === 'RED') criticalIndicators.push('C4');
                if (p.prenatal_data.prenatal_indicators.c5Status === 'RED') criticalIndicators.push('C5');
                if (p.prenatal_data.prenatal_indicators.c6Status === 'RED') criticalIndicators.push('C6');
                // Incluir amarelos também
                if (p.prenatal_data.prenatal_indicators.c1Status === 'YELLOW') criticalIndicators.push('C1');
                if (p.prenatal_data.prenatal_indicators.c2Status === 'YELLOW') criticalIndicators.push('C2');
                if (p.prenatal_data.prenatal_indicators.c3Status === 'YELLOW') criticalIndicators.push('C3');
                if (p.prenatal_data.prenatal_indicators.c4Status === 'YELLOW') criticalIndicators.push('C4');
                if (p.prenatal_data.prenatal_indicators.c5Status === 'YELLOW') criticalIndicators.push('C5');
                if (p.prenatal_data.prenatal_indicators.c6Status === 'YELLOW') criticalIndicators.push('C6');
            } else if (p.isPregnant) {
                // Gestante sem indicador = nunca acompanhada
                criticalIndicators.push('C1');
            }
            
            // Puericultura (B1-B5)
            if (p.childcare_indicators) {
                if (p.childcare_indicators.b1Status === 'RED') criticalIndicators.push('B1');
                if (p.childcare_indicators.b2Status === 'RED') criticalIndicators.push('B2');
                if (p.childcare_indicators.b3Status === 'RED') criticalIndicators.push('B3');
                if (p.childcare_indicators.b4Status === 'RED') criticalIndicators.push('B4');
                if (p.childcare_indicators.b5Status === 'RED') criticalIndicators.push('B5');
                // Incluir amarelos também
                if (p.childcare_indicators.b1Status === 'YELLOW') criticalIndicators.push('B1');
                if (p.childcare_indicators.b2Status === 'YELLOW') criticalIndicators.push('B2');
                if (p.childcare_indicators.b3Status === 'YELLOW') criticalIndicators.push('B3');
                if (p.childcare_indicators.b4Status === 'YELLOW') criticalIndicators.push('B4');
                if (p.childcare_indicators.b5Status === 'YELLOW') criticalIndicators.push('B5');
            } else if (p.isChild) {
                // Criança sem indicador = nunca acompanhada
                criticalIndicators.push('B1');
            }
            
            // Diabetes (D1-D6)
            if (p.diabetes_indicators) {
                if (p.diabetes_indicators.d1Status === 'RED') criticalIndicators.push('D1');
                if (p.diabetes_indicators.d2Status === 'RED') criticalIndicators.push('D2');
                if (p.diabetes_indicators.d3Status === 'RED') criticalIndicators.push('D3');
                if (p.diabetes_indicators.d4Status === 'RED') criticalIndicators.push('D4');
                if (p.diabetes_indicators.d5Status === 'RED') criticalIndicators.push('D5');
                if (p.diabetes_indicators.d6Status === 'RED') criticalIndicators.push('D6');
                // Incluir amarelos também
                if (p.diabetes_indicators.d1Status === 'YELLOW') criticalIndicators.push('D1');
                if (p.diabetes_indicators.d2Status === 'YELLOW') criticalIndicators.push('D2');
                if (p.diabetes_indicators.d3Status === 'YELLOW') criticalIndicators.push('D3');
                if (p.diabetes_indicators.d4Status === 'YELLOW') criticalIndicators.push('D4');
                if (p.diabetes_indicators.d5Status === 'YELLOW') criticalIndicators.push('D5');
                if (p.diabetes_indicators.d6Status === 'YELLOW') criticalIndicators.push('D6');
            }
            
            // Hipertensão (E1-E4)
            if (p.hypertension_indicators) {
                if (p.hypertension_indicators.e1Status === 'RED') criticalIndicators.push('E1');
                if (p.hypertension_indicators.e2Status === 'RED') criticalIndicators.push('E2');
                if (p.hypertension_indicators.e3Status === 'RED') criticalIndicators.push('E3');
                if (p.hypertension_indicators.e4Status === 'RED') criticalIndicators.push('E4');
                // Incluir amarelos também
                if (p.hypertension_indicators.e1Status === 'YELLOW') criticalIndicators.push('E1');
                if (p.hypertension_indicators.e2Status === 'YELLOW') criticalIndicators.push('E2');
                if (p.hypertension_indicators.e3Status === 'YELLOW') criticalIndicators.push('E3');
                if (p.hypertension_indicators.e4Status === 'YELLOW') criticalIndicators.push('E4');
            }
            
            // Idosos (F1-F2)
            if (p.elderly_indicators) {
                if (p.elderly_indicators.f1Status === 'RED') criticalIndicators.push('F1');
                if (p.elderly_indicators.f2Status === 'RED') criticalIndicators.push('F2');
                // Incluir amarelos também
                if (p.elderly_indicators.f1Status === 'YELLOW') criticalIndicators.push('F1');
                if (p.elderly_indicators.f2Status === 'YELLOW') criticalIndicators.push('F2');
            }
            
            // Saúde da Mulher (G1-G2)
            if (p.woman_health_indicators) {
                if (p.woman_health_indicators.g1Status === 'RED') criticalIndicators.push('G1');
                if (p.woman_health_indicators.g2Status === 'RED') criticalIndicators.push('G2');
                // Incluir amarelos também
                if (p.woman_health_indicators.g1Status === 'YELLOW') criticalIndicators.push('G1');
                if (p.woman_health_indicators.g2Status === 'YELLOW') criticalIndicators.push('G2');
            }

            return {
                id: p.id,
                fullName: p.fullName,
                age,
                microArea: p.micro_areas.name,
                criticalIndicators
            };
        });
    }

    async getAgents() {
        return await prisma.users.findMany({
            where: {
                role: 'ACS',
                isActive: true,
                deletedAt: null
            },
            select: {
                id: true,
                fullName: true,
                micro_areas: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { fullName: 'asc' }
        });
    }

    async getMicroAreas() {
        return await prisma.micro_areas.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                },
                _count: {
                    select: {
                        patients: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async getDetailedIndicators(microAreaId?: string, agentId?: string) {
        let effectiveMicroAreaId = microAreaId;

        if (agentId) {
            const agent = await prisma.users.findUnique({
                where: { id: agentId },
                select: { microAreaId: true }
            });
            if (agent?.microAreaId) {
                effectiveMicroAreaId = agent.microAreaId;
            }
        }

        const where: any = effectiveMicroAreaId ? { patients: { microAreaId: effectiveMicroAreaId } } : {};
        const wherePrenatal: any = effectiveMicroAreaId ? { prenatal_data: { patients: { microAreaId: effectiveMicroAreaId } } } : {};

        // 1. Diabetes Indicators (D1)
        const diabetesStats = await prisma.diabetes_indicators.groupBy({
            by: ['d1Status'],
            where,
            _count: true
        });

        // 2. Hypertension Indicators (E1)
        const hypertensionStats = await prisma.hypertension_indicators.groupBy({
            by: ['e1Status'],
            where,
            _count: true
        });

        // 3. Prenatal Indicators (C1)
        const prenatalC1Stats = await prisma.prenatal_indicators.groupBy({
            by: ['c1Status'],
            where: wherePrenatal,
            _count: true
        });

        // 4. Prenatal Exams (C6)
        const prenatalC6Stats = await prisma.prenatal_indicators.groupBy({
            by: ['c6Status'],
            where: wherePrenatal,
            _count: true
        });

        // 5. Woman Health - Pap Smear (G1)
        const womanG1Stats = await prisma.woman_health_indicators.groupBy({
            by: ['g1Status'],
            where,
            _count: true
        });

        // 6. Woman Health - Mammography (G2)
        const womanG2Stats = await prisma.woman_health_indicators.groupBy({
            by: ['g2Status'],
            where,
            _count: true
        });

        // 7. Elderly - Polypharmacy (F1)
        const elderlyF1Stats = await prisma.elderly_indicators.groupBy({
            by: ['f1Status'],
            where,
            _count: true
        });

        // 8. Elderly - IVCF Assessment (F2)
        const elderlyF2Stats = await prisma.elderly_indicators.groupBy({
            by: ['f2Status'],
            where,
            _count: true
        });

        // 9. Childcare - First Consultation (B1)
        const childcareB1Stats = await prisma.childcare_indicators.groupBy({
            by: ['b1Status'],
            where,
            _count: true
        });

        // 10. Childcare - 9 Consultations (B2)
        const childcareB2Stats = await prisma.childcare_indicators.groupBy({
            by: ['b2Status'],
            where,
            _count: true
        });

        // 11. Childcare - Vaccines (B5)
        const childcareB5Stats = await prisma.childcare_indicators.groupBy({
            by: ['b5Status'],
            where,
            _count: true
        });

        // 12. Mais Acesso à APS - Agendamentos realizados nos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const appointmentWhere: any = {
            scheduledDate: { gte: thirtyDaysAgo },
            status: { in: ['COMPLETED', 'SCHEDULED', 'CONFIRMED'] }
        };

        if (effectiveMicroAreaId) {
            appointmentWhere.patients = { microAreaId: effectiveMicroAreaId };
        }

        const totalAppointments = await prisma.appointments.count({ where: appointmentWhere });
        const completedAppointments = await prisma.appointments.count({
            where: { ...appointmentWhere, status: 'COMPLETED' }
        });

        const appointmentPercent = totalAppointments > 0 
            ? Math.round((completedAppointments / totalAppointments) * 100) 
            : 0;

        // Calculate percentages
        const calculateData = (stats: any[], statusField: string) => {
            const total = stats.reduce((acc, curr) => acc + curr._count, 0);
            const green = stats.find(s => s[statusField] === 'GREEN')?._count || 0;
            const yellow = stats.find(s => s[statusField] === 'YELLOW')?._count || 0;
            const red = stats.find(s => s[statusField] === 'RED')?._count || 0;
            return {
                total,
                percent: total > 0 ? Math.round((green / total) * 100) : 0,
                green,
                yellow,
                red,
            };
        };

        // Buscar todos os indicadores de crianças
        const childcareB3Stats = await prisma.childcare_indicators.groupBy({ by: ['b3Status'], where, _count: true });
        const childcareB4Stats = await prisma.childcare_indicators.groupBy({ by: ['b4Status'], where, _count: true });

        // Buscar todos os indicadores de gestantes
        const prenatalC2Stats = await prisma.prenatal_indicators.groupBy({ by: ['c2Status'], where: wherePrenatal, _count: true });
        const prenatalC3Stats = await prisma.prenatal_indicators.groupBy({ by: ['c3Status'], where: wherePrenatal, _count: true });
        const prenatalC4Stats = await prisma.prenatal_indicators.groupBy({ by: ['c4Status'], where: wherePrenatal, _count: true });
        const prenatalC5Stats = await prisma.prenatal_indicators.groupBy({ by: ['c5Status'], where: wherePrenatal, _count: true });

        // Buscar todos os indicadores de diabetes
        const diabetesD2Stats = await prisma.diabetes_indicators.groupBy({ by: ['d2Status'], where, _count: true });
        const diabetesD3Stats = await prisma.diabetes_indicators.groupBy({ by: ['d3Status'], where, _count: true });
        const diabetesD4Stats = await prisma.diabetes_indicators.groupBy({ by: ['d4Status'], where, _count: true });
        const diabetesD5Stats = await prisma.diabetes_indicators.groupBy({ by: ['d5Status'], where, _count: true });
        const diabetesD6Stats = await prisma.diabetes_indicators.groupBy({ by: ['d6Status'], where, _count: true });

        // Buscar todos os indicadores de hipertensão
        const hypertensionE2Stats = await prisma.hypertension_indicators.groupBy({ by: ['e2Status'], where, _count: true });
        const hypertensionE3Stats = await prisma.hypertension_indicators.groupBy({ by: ['e3Status'], where, _count: true });
        const hypertensionE4Stats = await prisma.hypertension_indicators.groupBy({ by: ['e4Status'], where, _count: true });

        // Buscar todos os indicadores de idosos
        const elderlyAStats = await prisma.elderly_indicators.groupBy({ by: ['aStatus'], where, _count: true });
        const elderlyBStats = await prisma.elderly_indicators.groupBy({ by: ['bStatus'], where, _count: true });
        const elderlyC3Stats = await prisma.elderly_indicators.groupBy({ by: ['c3Status'], where, _count: true });
        const elderlyDStats = await prisma.elderly_indicators.groupBy({ by: ['dStatus'], where, _count: true });

        // Buscar todos os indicadores de mulher
        const womanBStats = await prisma.woman_health_indicators.groupBy({ by: ['bStatus'], where, _count: true });
        const womanCStats = await prisma.woman_health_indicators.groupBy({ by: ['cStatus'], where, _count: true });

        return [
            // C1 - Mais Acesso
            { 
                id: 'A1', 
                name: 'Mais Acesso à APS', 
                total: totalAppointments,
                percent: appointmentPercent,
                green: completedAppointments,
                yellow: totalAppointments - completedAppointments,
                red: 0
            },
            
            // C2 - Crianças
            { id: 'B1', name: 'Puericultura (1ª Consulta)', ...calculateData(childcareB1Stats, 'b1Status') },
            { id: 'B2', name: 'Puericultura (9 Consultas)', ...calculateData(childcareB2Stats, 'b2Status') },
            { id: 'B3', name: 'Antropometria Infantil', ...calculateData(childcareB3Stats, 'b3Status') },
            { id: 'B4', name: 'Visitas ACS Criança', ...calculateData(childcareB4Stats, 'b4Status') },
            { id: 'B5', name: 'Vacinas Completas', ...calculateData(childcareB5Stats, 'b5Status') },
            
            // C3 - Gestantes
            { id: 'C1', name: 'Pré-Natal Completo', ...calculateData(prenatalC1Stats, 'c1Status') },
            { id: 'C2', name: 'PA Gestante', ...calculateData(prenatalC2Stats, 'c2Status') },
            { id: 'C3', name: 'Antropometria Gestante', ...calculateData(prenatalC3Stats, 'c3Status') },
            { id: 'C4', name: 'Visitas ACS Gestante', ...calculateData(prenatalC4Stats, 'c4Status') },
            { id: 'C5', name: 'Vacina dTpa', ...calculateData(prenatalC5Stats, 'c5Status') },
            { id: 'C6', name: 'Exames Pré-Natal', ...calculateData(prenatalC6Stats, 'c6Status') },
            
            // C4 - Diabetes
            { id: 'D1', name: 'Consultas Diabetes', ...calculateData(diabetesStats, 'd1Status') },
            { id: 'D2', name: 'PA Diabetes', ...calculateData(diabetesD2Stats, 'd2Status') },
            { id: 'D3', name: 'Antropometria Diabetes', ...calculateData(diabetesD3Stats, 'd3Status') },
            { id: 'D4', name: 'Visitas ACS Diabetes', ...calculateData(diabetesD4Stats, 'd4Status') },
            { id: 'D5', name: 'HbA1c', ...calculateData(diabetesD5Stats, 'd5Status') },
            { id: 'D6', name: 'Avaliação Pés', ...calculateData(diabetesD6Stats, 'd6Status') },
            
            // C5 - Hipertensão
            { id: 'E1', name: 'Consultas Hipertensão', ...calculateData(hypertensionStats, 'e1Status') },
            { id: 'E2', name: 'PA Hipertensão', ...calculateData(hypertensionE2Stats, 'e2Status') },
            { id: 'E3', name: 'Antropometria Hipertensão', ...calculateData(hypertensionE3Stats, 'e3Status') },
            { id: 'E4', name: 'Visitas ACS Hipertensão', ...calculateData(hypertensionE4Stats, 'e4Status') },
            
            // C6 - Idosos
            { id: 'A-ELDERLY', name: 'Consultas Idoso', ...calculateData(elderlyAStats, 'aStatus') },
            { id: 'B-ELDERLY', name: 'Antropometria Idoso', ...calculateData(elderlyBStats, 'bStatus') },
            { id: 'C3-ELDERLY', name: 'Visitas ACS Idoso', ...calculateData(elderlyC3Stats, 'c3Status') },
            { id: 'D-ELDERLY', name: 'Vacina Influenza', ...calculateData(elderlyDStats, 'dStatus') },
            { id: 'F1', name: 'Polifarmácia', ...calculateData(elderlyF1Stats, 'f1Status') },
            { id: 'F2', name: 'IVCF-20', ...calculateData(elderlyF2Stats, 'f2Status') },
            
            // C7 - Mulher
            { id: 'G1', name: 'Papanicolau', ...calculateData(womanG1Stats, 'g1Status') },
            { id: 'G2', name: 'Mamografia', ...calculateData(womanG2Stats, 'g2Status') },
            { id: 'B-WOMAN', name: 'Vacina HPV', ...calculateData(womanBStats, 'bStatus') },
            { id: 'C-WOMAN', name: 'Saúde Sexual/Reprodutiva', ...calculateData(womanCStats, 'cStatus') },
        ];
    }

    async createMicroArea(data: { name: string; code: string; description?: string; acsId?: string }) {
        const existingCode = await prisma.micro_areas.findUnique({
            where: { code: data.code }
        });

        if (existingCode) {
            throw new AppError(409, 'Código da microárea já existe', 'DUPLICATE_CODE');
        }

        // Se um ACS foi selecionado, validar
        if (data.acsId) {
            const acsUser = await prisma.users.findUnique({
                where: { id: data.acsId }
            });

            if (!acsUser) {
                throw new AppError(404, 'ACS não encontrado', 'ACS_NOT_FOUND');
            }

            if (acsUser.role !== 'ACS') {
                throw new AppError(400, 'Usuário selecionado não é um ACS', 'INVALID_ROLE');
            }
        }

        // Criar microárea
        const microArea = await prisma.micro_areas.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                updatedAt: new Date()
            }
        });

        // Atualizar o usuário ACS com a nova microárea
        if (data.acsId) {
            await prisma.users.update({
                where: { id: data.acsId },
                data: { microAreaId: microArea.id }
            });
        }

        return microArea;
    }

    async updateMicroArea(id: string, data: { name?: string; code?: string; description?: string; acsId?: string }) {
        const microArea = await prisma.micro_areas.findUnique({
            where: { id },
            include: {
                users: true
            }
        });

        if (!microArea) {
            throw new AppError(404, 'Microárea não encontrada', 'NOT_FOUND');
        }

        if (data.code && data.code !== microArea.code) {
            const existingCode = await prisma.micro_areas.findUnique({
                where: { code: data.code }
            });

            if (existingCode) {
                throw new AppError(409, 'Código da microárea já existe', 'DUPLICATE_CODE');
            }
        }

        // Se o ACS mudou, atualizar relacionamentos
        if (data.acsId !== undefined) {
            // Remover todos os ACS antigos desta microárea
            await prisma.users.updateMany({
                where: { microAreaId: id },
                data: { microAreaId: null }
            });

            // Se um novo ACS foi selecionado, validar e atribuir
            if (data.acsId) {
                const acsUser = await prisma.users.findUnique({
                    where: { id: data.acsId }
                });

                if (!acsUser) {
                    throw new AppError(404, 'ACS não encontrado', 'ACS_NOT_FOUND');
                }

                if (acsUser.role !== 'ACS') {
                    throw new AppError(400, 'Usuário selecionado não é um ACS', 'INVALID_ROLE');
                }

                // Atribuir o novo ACS a esta microárea
                await prisma.users.update({
                    where: { id: data.acsId },
                    data: { microAreaId: id }
                });
            }
        }

        // Atualizar microárea
        const updatedMicroArea = await prisma.micro_areas.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                updatedAt: new Date()
            }
        });

        return updatedMicroArea;
    }

    async deleteMicroArea(id: string) {
        const microArea = await prisma.micro_areas.findUnique({
            where: { id }
        });

        if (!microArea) {
            throw new Error('Microárea não encontrada');
        }

        const usersCount = await prisma.users.count({
            where: { microAreaId: id }
        });

        if (usersCount > 0) {
            throw new Error('Não é possível deletar uma microárea que possui usuários vinculados');
        }

        const patientsCount = await prisma.patients.count({
            where: { microAreaId: id }
        });

        if (patientsCount > 0) {
            throw new Error('Não é possível deletar uma microárea que possui pacientes vinculados');
        }

        return await prisma.micro_areas.delete({
            where: { id }
        });
    }
}
