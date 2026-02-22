import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardService {
  /**
   * Obter estatísticas por período
   */
  async getStatsByPeriod(filters: {
    startDate: Date;
    endDate: Date;
    microAreaId?: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  }) {
    const { microAreaId, period } = filters;
    
    // Ajustar startDate para início do dia
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // Ajustar endDate para final do dia
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('📊 getStatsByPeriod - Datas ajustadas:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      period,
      microAreaId
    });

    // Gerar intervalos de tempo baseado no período
    const intervals = this.generateIntervals(startDate, endDate, period);
    
    console.log('📊 Intervalos gerados:', intervals.length, intervals.map(i => i.label));

    const stats = await Promise.all(
      intervals.map(async (interval) => {
        const patientWhere: any = {
          createdAt: {
            gte: interval.start,
            lte: interval.end,
          },
        };

        if (microAreaId) {
          patientWhere.microAreaId = microAreaId;
        }

        // Filtro para relacionamentos com pacientes
        const relationWhere = microAreaId 
          ? { patients: { microAreaId } }
          : {};

        const [
          newPatients,
          appointments,
          homeVisits,
          vaccineApplications,
          evaluatedExams,
        ] = await Promise.all([
          prisma.patients.count({ where: patientWhere }),
          prisma.appointments.count({
            where: {
              scheduledDate: {
                gte: interval.start,
                lte: interval.end,
              },
              ...relationWhere,
            },
          }),
          prisma.home_visits.count({
            where: {
              visitDate: {
                gte: interval.start,
                lte: interval.end,
              },
              ...relationWhere,
            },
          }),
          prisma.vaccine_records.count({
            where: {
              applicationDate: {
                gte: interval.start,
                lte: interval.end,
              },
              ...relationWhere,
            },
          }),
          prisma.prenatal_exams.count({
            where: {
              evaluated: true,
              evaluatedAt: {
                gte: interval.start,
                lte: interval.end,
              },
              ...(microAreaId && {
                prenatal_data: {
                  patients: { microAreaId },
                },
              }),
            },
          }),
        ]);

        return {
          period: interval.label,
          startDate: interval.start,
          endDate: interval.end,
          newPatients,
          appointments,
          homeVisits,
          vaccineApplications,
          evaluatedExams,
          total: appointments + homeVisits + vaccineApplications + evaluatedExams,
        };
      })
    );

    console.log('📊 Estatísticas calculadas:', stats.map(s => ({ 
      period: s.period, 
      homeVisits: s.homeVisits,
      total: s.total 
    })));

    return stats;
  }

  /**
   * Obter evolução de indicadores por período
   */
  async getIndicatorEvolution(filters: {
    startDate: Date;
    endDate: Date;
    microAreaId?: string;
    indicator: string;
  }) {
    const { microAreaId, indicator } = filters;
    
    // Ajustar startDate para início do dia
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // Ajustar endDate para final do dia
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('📈 getIndicatorEvolution - Datas ajustadas:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      indicator,
      microAreaId
    });

    // Gerar intervalos mensais
    const intervals = this.generateIntervals(startDate, endDate, 'monthly');
    
    console.log('📈 Intervalos gerados:', intervals.length, intervals.map(i => i.label));

    const evolution = await Promise.all(
      intervals.map(async (interval) => {
        const where: any = {};

        if (microAreaId) {
          where.patient = { microAreaId };
        }

        let green = 0;
        let yellow = 0;
        let red = 0;

        // Buscar dados do indicador específico
        switch (indicator) {
          case 'prenatal':
            const prenatalData = await prisma.prenatal_indicators.groupBy({
              by: ['c1Status'],
              _count: true,
              where,
            });
            prenatalData.forEach((item) => {
              if (item.c1Status === 'GREEN') green = item._count;
              else if (item.c1Status === 'YELLOW') yellow = item._count;
              else if (item.c1Status === 'RED') red = item._count;
            });
            break;

          case 'childcare':
            const childcareData = await prisma.childcare_indicators.groupBy({
              by: ['b1Status'],
              _count: true,
              where,
            });
            childcareData.forEach((item) => {
              if (item.b1Status === 'GREEN') green = item._count;
              else if (item.b1Status === 'YELLOW') yellow = item._count;
              else if (item.b1Status === 'RED') red = item._count;
            });
            break;

          case 'diabetes':
            const diabetesData = await prisma.diabetes_indicators.groupBy({
              by: ['d1Status'],
              _count: true,
              where,
            });
            diabetesData.forEach((item) => {
              if (item.d1Status === 'GREEN') green = item._count;
              else if (item.d1Status === 'YELLOW') yellow = item._count;
              else if (item.d1Status === 'RED') red = item._count;
            });
            break;

          case 'hypertension':
            const hypertensionData = await prisma.hypertension_indicators.groupBy({
              by: ['e1Status'],
              _count: true,
              where,
            });
            hypertensionData.forEach((item) => {
              if (item.e1Status === 'GREEN') green = item._count;
              else if (item.e1Status === 'YELLOW') yellow = item._count;
              else if (item.e1Status === 'RED') red = item._count;
            });
            break;

          case 'elderly':
            const elderlyData = await prisma.elderly_indicators.groupBy({
              by: ['f1Status'],
              _count: true,
              where,
            });
            elderlyData.forEach((item) => {
              if (item.f1Status === 'GREEN') green = item._count;
              else if (item.f1Status === 'YELLOW') yellow = item._count;
              else if (item.f1Status === 'RED') red = item._count;
            });
            break;

          case 'woman':
            const womanData = await prisma.woman_health_indicators.groupBy({
              by: ['g1Status'],
              _count: true,
              where,
            });
            womanData.forEach((item) => {
              if (item.g1Status === 'GREEN') green = item._count;
              else if (item.g1Status === 'YELLOW') yellow = item._count;
              else if (item.g1Status === 'RED') red = item._count;
            });
            break;
        }

        return {
          period: interval.label,
          startDate: interval.start,
          endDate: interval.end,
          green,
          yellow,
          red,
          total: green + yellow + red,
          greenPercentage: green + yellow + red > 0 ? (green / (green + yellow + red)) * 100 : 0,
        };
      })
    );

    return evolution;
  }

  /**
   * Comparar períodos
   */
  async comparePeriods(filters: {
    period1Start: Date;
    period1End: Date;
    period2Start: Date;
    period2End: Date;
    microAreaId?: string;
  }) {
    const { period1Start, period1End, period2Start, period2End, microAreaId } = filters;

    const [period1Stats, period2Stats] = await Promise.all([
      this.getPeriodStats(period1Start, period1End, microAreaId),
      this.getPeriodStats(period2Start, period2End, microAreaId),
    ]);

    return {
      period1: {
        ...period1Stats,
        label: `${period1Start.toLocaleDateString('pt-BR')} - ${period1End.toLocaleDateString('pt-BR')}`,
      },
      period2: {
        ...period2Stats,
        label: `${period2Start.toLocaleDateString('pt-BR')} - ${period2End.toLocaleDateString('pt-BR')}`,
      },
      comparison: {
        newPatients: this.calculateGrowth(period1Stats.newPatients, period2Stats.newPatients),
        appointments: this.calculateGrowth(period1Stats.appointments, period2Stats.appointments),
        home_visits: this.calculateGrowth(period1Stats.homeVisits, period2Stats.homeVisits),
        vaccineApplications: this.calculateGrowth(
          period1Stats.vaccineApplications,
          period2Stats.vaccineApplications
        ),
        examRequests: this.calculateGrowth(period1Stats.examRequests, period2Stats.examRequests),
      },
    };
  }

  /**
   * Obter estatísticas de um período específico
   */
  private async getPeriodStats(startDate: Date, endDate: Date, microAreaId?: string) {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (microAreaId) {
      where.microAreaId = microAreaId;
    }

    const [newPatients, appointments, homeVisits, vaccineApplications, examRequests] =
      await Promise.all([
        prisma.patients.count({ where }),
        prisma.appointments.count({
          where: {
            scheduledDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(microAreaId && {
              patient: { microAreaId },
            }),
          },
        }),
        prisma.home_visits.count({
          where: {
            visitDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(microAreaId && {
              patient: { microAreaId },
            }),
          },
        }),
        prisma.vaccine_records.count({
          where: {
            applicationDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(microAreaId && {
              patient: { microAreaId },
            }),
          },
        }),
        prisma.prenatal_exams.count({
          where: {
            requestDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(microAreaId && {
              prenatal_data: {
                patients: { microAreaId },
              },
            }),
          },
        }),
      ]);

    return {
      newPatients,
      appointments,
      homeVisits,
      vaccineApplications,
      examRequests,
      total: appointments + homeVisits + vaccineApplications + examRequests,
    };
  }

  /**
   * Gerar intervalos de tempo
   */
  private generateIntervals(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  ) {
    const intervals: Array<{ start: Date; end: Date; label: string }> = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const intervalStart = new Date(current);
      intervalStart.setHours(0, 0, 0, 0);
      let intervalEnd: Date;
      let label: string;

      switch (period) {
        case 'daily':
          intervalEnd = new Date(current);
          intervalEnd.setHours(23, 59, 59, 999);
          label = intervalStart.toLocaleDateString('pt-BR');
          current.setDate(current.getDate() + 1);
          break;

        case 'weekly':
          intervalEnd = new Date(current);
          intervalEnd.setDate(intervalEnd.getDate() + 6);
          intervalEnd.setHours(23, 59, 59, 999);
          label = `Semana ${Math.ceil(intervalStart.getDate() / 7)}`;
          current.setDate(current.getDate() + 7);
          break;

        case 'monthly':
          intervalEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          intervalEnd.setHours(23, 59, 59, 999);
          label = intervalStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          current.setMonth(current.getMonth() + 1);
          break;

        case 'quarterly':
          const quarter = Math.floor(current.getMonth() / 3);
          intervalEnd = new Date(current.getFullYear(), (quarter + 1) * 3, 0);
          intervalEnd.setHours(23, 59, 59, 999);
          label = `Q${quarter + 1} ${current.getFullYear()}`;
          current.setMonth((quarter + 1) * 3);
          break;

        case 'yearly':
          intervalEnd = new Date(current.getFullYear(), 11, 31);
          intervalEnd.setHours(23, 59, 59, 999);
          label = current.getFullYear().toString();
          current.setFullYear(current.getFullYear() + 1);
          break;
      }

      if (intervalEnd > endDate) {
        intervalEnd = new Date(endDate);
        intervalEnd.setHours(23, 59, 59, 999);
      }

      intervals.push({
        start: intervalStart,
        end: intervalEnd,
        label,
      });

      if (intervalEnd >= endDate) break;
    }

    return intervals;
  }

  /**
   * Calcular crescimento percentual
   */
  private calculateGrowth(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
}




