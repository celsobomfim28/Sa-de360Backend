import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export class VaccineService {
  /**
   * Listar catálogo de vacinas
   */
  async listVaccines() {
    return await prisma.vaccines.findMany({
      orderBy: [
        { name: 'asc' }
      ]
    });
  }

  /**
   * Obter calendário vacinal do paciente
   */
  async getVaccineSchedule(patientId: string) {
      const patient = await prisma.patients.findUnique({
        where: { id: patientId },
        select: { 
          birthDate: true, 
          sex: true, 
          isPregnant: true,
          isChild: true,
          isElderly: true,
          isWoman: true
        }
      });

      if (!patient) {
        throw new Error('Paciente não encontrado');
      }

      const ageInMonths = this.calculateAgeInMonths(patient.birthDate);
      const ageInYears = Math.floor(ageInMonths / 12);

      console.log(`[VaccineService] Paciente: isChild=${patient.isChild}, isElderly=${patient.isElderly}, isPregnant=${patient.isPregnant}, isWoman=${patient.isWoman}, age=${ageInYears} anos`);

      // Buscar todas as vacinas
      const allVaccines = await prisma.vaccines.findMany({
        orderBy: { name: 'asc' }
      });

      // Filtrar vacinas aplicáveis baseado no perfil do paciente
      const applicableVaccines = allVaccines.filter(vaccine => {
        const vaccineName = vaccine.name.toLowerCase();

        // CRIANÇAS (0-2 anos) - Indicador B5
        // Prioridade: se é criança E tem menos de 2 anos, mostrar apenas vacinas infantis
        if (patient.isChild && ageInYears < 2) {
          const childVaccines = ['bcg', 'hepatite b', 'hepatite a', 'dtp', 'pólio', 'rotavírus', 
                                 'pneumocócica', 'meningocócica', 'tríplice viral', 'haemophilus influenzae'];
          return childVaccines.some(v => vaccineName.includes(v));
        }
        // GESTANTES - Indicador C5/F
        // Se é gestante, mostrar apenas dTpa (independente de outros grupos)
        else if (patient.isPregnant) {
          return vaccineName.includes('dtpa');
        }
        // MULHERES (9-14 anos) - Indicador B
        // Se é mulher na faixa etária de HPV, mostrar apenas HPV
        else if (patient.isWoman && patient.sex === 'FEMALE' && ageInYears >= 9 && ageInYears <= 14) {
          return vaccineName.includes('hpv');
        }
        // IDOSOS (60+) - Indicador D
        // Se é idoso, mostrar apenas Influenza
        else if (patient.isElderly && ageInYears >= 60) {
          // Importante: verificar se é exatamente "Influenza", não "Haemophilus influenzae"
          return vaccineName === 'influenza';
        }
        // Se não se encaixa em nenhum grupo específico, não mostrar vacinas
        else {
          return false;
        }
      });

      console.log(`[VaccineService] Total de vacinas aplicáveis: ${applicableVaccines.length}`);
      applicableVaccines.forEach(v => console.log(`  - ${v.name}`));

      // Buscar registros de vacinas do paciente
      const vaccineRecords = await prisma.vaccine_records.findMany({
        where: { patientId },
        include: { vaccines: true, users: { select: { fullName: true } } },
        orderBy: { applicationDate: 'desc' }
      });

      return {
        patient: {
          ageInMonths,
          ageInYears
        },
        schedule: applicableVaccines.map(vaccine => {
          const appliedDoses = vaccineRecords.filter(r => r.vaccineId === vaccine.id);
          const ageSchedule = vaccine.ageSchedule as any[];
          const totalDoses = ageSchedule?.length || 0;
          const nextDose = appliedDoses.length + 1;
          const isComplete = appliedDoses.length >= totalDoses;

          return {
            vaccine,
            appliedDoses: appliedDoses.map(r => ({
              dose: r.dose,
              date: r.applicationDate,
              users: r.users.fullName,
              batchNumber: r.batchNumber
            })),
            nextDose: isComplete ? null : nextDose,
            status: isComplete ? 'COMPLETE' : appliedDoses.length > 0 ? 'IN_PROGRESS' : 'PENDING'
          };
        })
      };
    }


  /**
   * Registrar aplicação de vacina
   */
  async registerVaccineApplication(data: {
    patientId: string;
    vaccineId: string;
    applicationDate: Date;
    dose: number;
    batchNumber?: string;
    appliedById: string;
  }) {
    // Validar se a vacina existe
    const vaccine = await prisma.vaccines.findUnique({
      where: { id: data.vaccineId }
    });

    if (!vaccine) {
      throw new Error('Vacina não encontrada');
    }

    // Validar se a dose é válida (baseado no ageSchedule)
    const ageSchedule = vaccine.ageSchedule as any[];
    const maxDoses = ageSchedule?.length || 1;
    if (data.dose < 1 || data.dose > maxDoses) {
      throw new Error(`Dose inválida. Esta vacina tem ${maxDoses} dose(s)`);
    }

    // Verificar se a dose já foi aplicada
    const existingRecord = await prisma.vaccine_records.findFirst({
      where: {
        patientId: data.patientId,
        vaccineId: data.vaccineId,
        dose: data.dose
      }
    });

    if (existingRecord) {
      throw new Error(`A ${data.dose}ª dose desta vacina já foi registrada`);
    }

    // Registrar aplicação
    const record = await prisma.vaccine_records.create({
      data: {
        id: randomUUID(),
        patients: { connect: { id: data.patientId } },
        vaccines: { connect: { id: data.vaccineId } },
        applicationDate: data.applicationDate,
        dose: data.dose,
        batchNumber: data.batchNumber,
        users: { connect: { id: data.appliedById } },
        updatedAt: new Date()
      },
      include: {
        vaccines: true,
        patients: { select: { fullName: true } },
        users: { select: { fullName: true } }
      }
    });

    // Atualizar indicadores se aplicável
    await this.updateVaccineIndicators(data.patientId);

    return record;
  }

  /**
   * Verificar vacinas pendentes
   */
  async checkPendingVaccines(patientId: string) {
    const schedule = await this.getVaccineSchedule(patientId);
    
    const pending = schedule.schedule.filter(s => s.status === 'PENDING');
    const inProgress = schedule.schedule.filter(s => s.status === 'IN_PROGRESS');
    
    // Para determinar atrasos, precisamos verificar a idade do paciente vs idade recomendada
    const delayed = schedule.schedule.filter(s => {
      if (s.status === 'COMPLETE') return false;
      
      const vaccine = s.vaccine;
      const ageInMonths = schedule.patient.ageInMonths;
      const ageSchedule = vaccine.ageSchedule as any[];
      
      // Verificar se está atrasada baseado no próximo dose esperado
      if (ageSchedule && s.nextDose) {
        const nextDoseSchedule = ageSchedule.find((d: any) => d.dose === s.nextDose);
        if (nextDoseSchedule && ageInMonths > nextDoseSchedule.ageInMonths + 2) {
          return true; // Atrasada se passou 2 meses da idade recomendada
        }
      }
      
      return false;
    });

    return {
      pending,
      inProgress,
      delayed,
      summary: {
        totalPending: pending.length,
        totalInProgress: inProgress.length,
        totalDelayed: delayed.length
      }
    };
  }

  /**
   * Obter cartão de vacinação completo
   */
  async getVaccinationCard(patientId: string) {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        fullName: true,
        cpf: true,
        cns: true,
        birthDate: true,
        sex: true,
        motherName: true
      }
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const vaccineRecords = await prisma.vaccine_records.findMany({
      where: { patientId },
      include: {
        vaccines: true,
        users: { select: { fullName: true, role: true } }
      },
      orderBy: { applicationDate: 'asc' }
    });

    // Agrupar por vacina
    const groupedRecords = vaccineRecords.reduce((acc, record) => {
      const key = record.vaccines.name;
      if (!acc[key]) {
        acc[key] = {
          vaccine: record.vaccines,
          applications: []
        };
      }
      acc[key].applications.push({
        dose: record.dose,
        date: record.applicationDate,
        batchNumber: record.batchNumber,
        users: record.users
      });
      return acc;
    }, {} as Record<string, any>);

    return {
      patient,
      vaccinations: Object.values(groupedRecords),
      totalApplications: vaccineRecords.length
    };
  }

  /**
   * Atualizar indicadores de vacina
   */
  private async updateVaccineIndicators(patientId: string) {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { isChild: true, isPregnant: true, isElderly: true, isWoman: true }
    });

    if (!patient) return;

    // Atualizar B5 para crianças
    if (patient.isChild) {
      const childcareIndicator = await prisma.childcare_indicators.findUnique({
        where: { patientId }
      });

      if (childcareIndicator) {
        const vaccineStatus = await this.calculateChildVaccineStatus(patientId);
        await prisma.childcare_indicators.update({
          where: { patientId },
          data: {
            vaccineStatus,
            b5Status: vaccineStatus === 'UP_TO_DATE' ? 'GREEN' : vaccineStatus === 'DELAYED' ? 'RED' : 'YELLOW'
          }
        });
      }
    }

    // Atualizar C5 para gestantes (dTpa após 20ª semana)
    if (patient.isPregnant) {
      const prenatalData = await prisma.prenatal_data.findUnique({
        where: { patientId },
        include: { prenatal_indicators: true }
      });

      if (prenatalData && prenatalData.prenatal_indicators) {
        const dtpaRecord = await prisma.vaccine_records.findFirst({
          where: {
            patientId,
            vaccines: { name: { contains: 'dTpa', mode: 'insensitive' } }
          },
          orderBy: { applicationDate: 'desc' }
        });

        if (dtpaRecord) {
          // Verificar se foi aplicada após 20ª semana
          const lastMenstrualDate = new Date(prenatalData.lastMenstrualDate);
          const applicationDate = new Date(dtpaRecord.applicationDate);
          const weeksSinceLastMenstrual = Math.floor((applicationDate.getTime() - lastMenstrualDate.getTime()) / (1000 * 60 * 60 * 24 * 7));

          if (weeksSinceLastMenstrual >= 20) {
            console.log('[VaccineService] ✅ Vacina dTpa aplicada APÓS 20ª semana - Indicador C5 GREEN');
            await prisma.prenatal_indicators.update({
              where: { prenatalDataId: prenatalData.id },
              data: {
                dtpaVaccineDate: dtpaRecord.applicationDate,
                c5Status: 'GREEN'
              }
            });
          } else {
            console.log('[VaccineService] ⚠️ Vacina dTpa aplicada ANTES da 20ª semana - Indicador C5 YELLOW');
            console.log(`[VaccineService] Semanas: ${weeksSinceLastMenstrual}`);
            await prisma.prenatal_indicators.update({
              where: { prenatalDataId: prenatalData.id },
              data: {
                dtpaVaccineDate: dtpaRecord.applicationDate,
                c5Status: 'YELLOW'
              }
            });
          }
        } else {
          await prisma.prenatal_indicators.update({
            where: { prenatalDataId: prenatalData.id },
            data: {
              c5Status: 'RED'
            }
          });
        }
      }
    }

    // Atualizar D para idosos (Vacina Influenza nos últimos 12 meses)
    if (patient.isElderly) {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const influenzaRecord = await prisma.vaccine_records.findFirst({
        where: {
          patientId,
          vaccines: { name: { contains: 'Influenza', mode: 'insensitive' } },
          applicationDate: { gte: twelveMonthsAgo }
        },
        orderBy: { applicationDate: 'desc' }
      });

      const elderlyIndicator = await prisma.elderly_indicators.findUnique({
        where: { patientId }
      });

      if (elderlyIndicator) {
        if (influenzaRecord) {
          console.log('[VaccineService] ✅ Vacina Influenza aplicada nos últimos 12 meses - Indicador D GREEN');
          await prisma.elderly_indicators.update({
            where: { patientId },
            data: {
              lastInfluenzaVaccineDate: influenzaRecord.applicationDate,
              dStatus: 'GREEN',
              lastUpdated: new Date()
            }
          });
        } else {
          await prisma.elderly_indicators.update({
            where: { patientId },
            data: {
              dStatus: 'RED',
              lastUpdated: new Date()
            }
          });
          console.log('[VaccineService] ❌ Vacina Influenza não aplicada nos últimos 12 meses - Indicador D RED');
        }
      }
    }

    // Atualizar B para mulheres (Vacina HPV para 9-14 anos)
    if (patient.isWoman) {
      const patientData = await prisma.patients.findUnique({
        where: { id: patientId },
        select: { birthDate: true, sex: true }
      });

      if (patientData) {
        const age = Math.floor((new Date().getTime() - new Date(patientData.birthDate).getTime()) / (31557600000));

        // HPV é para meninas de 9 a 14 anos
        if (age >= 9 && age <= 14 && patientData.sex === 'FEMALE') {
          const hpvRecord = await prisma.vaccine_records.findFirst({
            where: {
              patientId,
              vaccines: { name: { contains: 'HPV', mode: 'insensitive' } }
            },
            orderBy: { applicationDate: 'desc' }
          });

          const womanIndicator = await prisma.woman_health_indicators.findUnique({
            where: { patientId }
          });

          if (womanIndicator) {
            if (hpvRecord) {
              console.log('[VaccineService] ✅ Vacina HPV aplicada - Indicador B GREEN');
              await prisma.woman_health_indicators.update({
                where: { patientId },
                data: {
                  lastHpvVaccineDate: hpvRecord.applicationDate,
                  bStatus: 'GREEN',
                  lastUpdated: new Date()
                }
              });
            } else {
              await prisma.woman_health_indicators.update({
                where: { patientId },
                data: {
                  bStatus: 'RED',
                  lastUpdated: new Date()
                }
              });
              console.log('[VaccineService] ❌ Vacina HPV não aplicada - Indicador B RED');
            }
          }
        }
      }
    }
  }

  /**
   * Calcular status de vacinas para crianças
   */
  private async calculateChildVaccineStatus(patientId: string): Promise<'UP_TO_DATE' | 'DELAYED' | 'NOT_STARTED'> {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { birthDate: true }
    });

    if (!patient) return 'NOT_STARTED';

    const ageInMonths = this.calculateAgeInMonths(patient.birthDate);
    
    // Buscar todas as vacinas
    const allVaccines = await prisma.vaccines.findMany();

    if (allVaccines.length === 0) return 'UP_TO_DATE';

    // Buscar vacinas aplicadas
    const appliedVaccines = await prisma.vaccine_records.findMany({
      where: { patientId },
      include: { vaccines: true }
    });

    if (appliedVaccines.length === 0) return 'NOT_STARTED';

    // Verificar se todas as vacinas obrigatórias foram aplicadas
    let hasDelayed = false;
    let hasPending = false;

    for (const vaccine of allVaccines) {
      const ageSchedule = vaccine.ageSchedule as any[];
      if (!ageSchedule) continue;

      const applied = appliedVaccines.filter(a => a.vaccineId === vaccine.id);
      const totalDoses = ageSchedule.length;

      if (applied.length < totalDoses) {
        hasPending = true;
        
        // Verificar se está atrasada
        const nextDose = applied.length + 1;
        const nextDoseSchedule = ageSchedule.find((d: any) => d.dose === nextDose);
        if (nextDoseSchedule && ageInMonths > nextDoseSchedule.ageInMonths + 2) {
          hasDelayed = true;
          break;
        }
      }
    }

    if (hasDelayed) return 'DELAYED';
    if (hasPending) return 'NOT_STARTED';
    return 'UP_TO_DATE';
  }

  /**
   * Calcular idade em meses
   */
  private calculateAgeInMonths(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return months;
  }
}






