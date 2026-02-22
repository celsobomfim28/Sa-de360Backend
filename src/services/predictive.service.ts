import prisma from '../config/database';

interface PredictionResult {
  patientId: string;
  patientName: string;
  prediction: string;
  probability: number;
  factors: string[];
  recommendation: string;
}

interface TrendAnalysis {
  indicator: string;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  changePercentage: number;
  prediction: string;
}

export class PredictiveService {
  // Predizer faltas em consultas
  async predictAppointmentNoShows(microAreaId?: string): Promise<PredictionResult[]> {
    const where: any = {
      deletedAt: null,
      appointments: {
        some: {
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          appointmentDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 dias
          },
        },
      },
    };

    if (microAreaId) {
      where.microAreaId = microAreaId;
    }

    const patients = await prisma.patients.findMany({
      where,
      include: {
        appointments: {
          where: {
            appointmentDate: {
              lte: new Date(),
            },
          },
          orderBy: { appointmentDate: 'desc' },
          take: 10,
        },
      },
    });

    const predictions: PredictionResult[] = [];

    for (const patient of patients) {
      const noShowCount = patient.appointments.filter(a => a.status === 'NO_SHOW').length;
      const totalPastAppointments = patient.appointments.length;

      if (totalPastAppointments === 0) continue;

      const noShowRate = noShowCount / totalPastAppointments;
      const factors: string[] = [];

      // Fatores de risco
      if (noShowRate > 0.3) factors.push('Histórico de faltas frequentes');
      if (noShowRate > 0.5) factors.push('Padrão crítico de faltas');
      
      // Análise de idade
      const age = patient.age;
      if (age < 18 || age > 65) factors.push('Faixa etária de risco');

      // Análise de distância (se tiver coordenadas)
      if (!patient.latitude || !patient.longitude) {
        factors.push('Sem localização cadastrada');
      }

      // Calcular probabilidade de falta
      let probability = noShowRate * 100;
      
      // Ajustar baseado em fatores
      if (factors.length > 2) probability = Math.min(probability + 20, 95);
      if (age < 18) probability = Math.min(probability + 10, 95);
      if (age > 65) probability = Math.min(probability + 5, 95);

      if (probability > 30) {
        predictions.push({
          patientId: patient.id,
          patientName: patient.fullName,
          prediction: probability > 60 ? 'ALTA' : probability > 40 ? 'MÉDIA' : 'BAIXA',
          probability: Math.round(probability),
          factors,
          recommendation: this.getNoShowRecommendation(probability, factors),
        });
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  // Identificar pacientes de risco
  async identifyRiskPatients(microAreaId?: string): Promise<PredictionResult[]> {
    const where: any = { deletedAt: null };
    if (microAreaId) {
      where.microAreaId = microAreaId;
    }

    const patients = await prisma.patients.findMany({
      where,
      include: {
        prenatal_data: { include: { prenatalIndicator: true } },
        childcareData: { include: { childcare_indicators: true } },
        diabetesData: { include: { diabetes_indicators: true } },
        hypertensionData: { include: { hypertension_indicators: true } },
        elderlyData: { include: { elderly_indicators: true } },
        womanHealthData: { include: { woman_health_indicators: true } },
        home_visits: {
          where: {
            visitDate: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // últimos 90 dias
            },
          },
        },
        appointments: {
          where: {
            appointmentDate: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // últimos 180 dias
            },
          },
        },
      },
    });

    const riskPatients: PredictionResult[] = [];

    for (const patient of patients) {
      const riskScore = this.calculateRiskScore(patient);
      
      if (riskScore.score > 50) {
        riskPatients.push({
          patientId: patient.id,
          patientName: patient.fullName,
          prediction: riskScore.score > 75 ? 'CRÍTICO' : riskScore.score > 60 ? 'ALTO' : 'MODERADO',
          probability: riskScore.score,
          factors: riskScore.factors,
          recommendation: this.getRiskRecommendation(riskScore.score, riskScore.factors),
        });
      }
    }

    return riskPatients.sort((a, b) => b.probability - a.probability);
  }

  // Sugerir ações preventivas
  async suggestPreventiveActions(patientId: string): Promise<{
    actions: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      action: string;
      reason: string;
      deadline: string;
    }>;
  }> {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        prenatal_data: { include: { prenatalIndicator: true } },
        childcareData: { include: { childcare_indicators: true } },
        diabetesData: { include: { diabetes_indicators: true } },
        hypertensionData: { include: { hypertension_indicators: true } },
        elderlyData: { include: { elderly_indicators: true } },
        womanHealthData: { include: { woman_health_indicators: true } },
        home_visits: {
          orderBy: { visitDate: 'desc' },
          take: 5,
        },
        appointments: {
          where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
          orderBy: { appointmentDate: 'asc' },
          take: 5,
        },
      },
    });

    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    const actions: any[] = [];

    // Análise de indicadores críticos
    const indicators = this.getPatientIndicators(patient);
    const criticalIndicators = indicators.filter(i => i.status === 'RED');
    const warningIndicators = indicators.filter(i => i.status === 'YELLOW');

    // Ações para indicadores críticos
    for (const indicator of criticalIndicators) {
      actions.push({
        priority: 'HIGH' as const,
        action: this.getIndicatorAction(indicator.code),
        reason: `Indicador ${indicator.code} em status crítico`,
        deadline: 'Imediato',
      });
    }

    // Ações para indicadores de atenção
    for (const indicator of warningIndicators) {
      actions.push({
        priority: 'MEDIUM' as const,
        action: this.getIndicatorAction(indicator.code),
        reason: `Indicador ${indicator.code} requer atenção`,
        deadline: '7 dias',
      });
    }

    // Verificar visitas domiciliares
    const lastVisit = patient.homeVisits[0];
    const daysSinceLastVisit = lastVisit
      ? Math.floor((Date.now() - new Date(lastVisit.visitDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastVisit > 90) {
      actions.push({
        priority: 'MEDIUM' as const,
        action: 'Agendar visita domiciliar',
        reason: `Última visita há ${daysSinceLastVisit} dias`,
        deadline: '15 dias',
      });
    }

    // Verificar consultas futuras
    if (patient.appointments.length === 0) {
      actions.push({
        priority: 'LOW' as const,
        action: 'Agendar consulta de acompanhamento',
        reason: 'Sem consultas agendadas',
        deadline: '30 dias',
      });
    }

    return { actions: actions.slice(0, 10) }; // Limitar a 10 ações
  }

  // Analisar tendências de indicadores
  async analyzeTrends(microAreaId?: string, months: number = 6): Promise<TrendAnalysis[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Buscar dados históricos (simplificado - em produção usaria tabela de histórico)
    const where: any = { deletedAt: null };
    if (microAreaId) {
      where.microAreaId = microAreaId;
    }

    const currentData = await this.getIndicatorStats(where);
    
    // Simular dados históricos (em produção, buscar de tabela de histórico)
    const historicalData = this.simulateHistoricalData(currentData, months);

    const trends: TrendAnalysis[] = [];

    for (const indicator of Object.keys(currentData)) {
      const current = currentData[indicator];
      const historical = historicalData[indicator];

      const changePercentage = ((current - historical) / historical) * 100;

      let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
      if (changePercentage > 5) trend = 'IMPROVING';
      if (changePercentage < -5) trend = 'DECLINING';

      trends.push({
        indicator,
        trend,
        changePercentage: Math.round(changePercentage * 10) / 10,
        prediction: this.getTrendPrediction(trend, changePercentage),
      });
    }

    return trends;
  }

  // Alertas inteligentes
  async generateSmartAlerts(microAreaId?: string): Promise<Array<{
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    message: string;
    affectedPatients: number;
    action: string;
  }>> {
    const alerts: any[] = [];

    // Buscar pacientes de risco
    const riskPatients = await this.identifyRiskPatients(microAreaId);
    
    if (riskPatients.length > 0) {
      const critical = riskPatients.filter(p => p.prediction === 'CRÍTICO').length;
      const high = riskPatients.filter(p => p.prediction === 'ALTO').length;

      if (critical > 0) {
        alerts.push({
          type: 'CRITICAL' as const,
          title: 'Pacientes em Risco Crítico',
          message: `${critical} paciente(s) identificado(s) com risco crítico`,
          affectedPatients: critical,
          action: 'Revisar lista de pacientes críticos',
        });
      }

      if (high > 0) {
        alerts.push({
          type: 'WARNING' as const,
          title: 'Pacientes em Alto Risco',
          message: `${high} paciente(s) com alto risco identificado`,
          affectedPatients: high,
          action: 'Planejar intervenções preventivas',
        });
      }
    }

    // Buscar tendências negativas
    const trends = await this.analyzeTrends(microAreaId);
    const decliningTrends = trends.filter(t => t.trend === 'DECLINING');

    if (decliningTrends.length > 0) {
      alerts.push({
        type: 'WARNING' as const,
        title: 'Tendência de Declínio em Indicadores',
        message: `${decliningTrends.length} indicador(es) em tendência de declínio`,
        affectedPatients: 0,
        action: 'Analisar causas e implementar melhorias',
      });
    }

    // Buscar faltas previstas
    const noShowPredictions = await this.predictAppointmentNoShows(microAreaId);
    const highRiskNoShows = noShowPredictions.filter(p => p.probability > 60).length;

    if (highRiskNoShows > 0) {
      alerts.push({
        type: 'WARNING' as const,
        title: 'Alto Risco de Faltas em Consultas',
        message: `${highRiskNoShows} consulta(s) com alto risco de falta`,
        affectedPatients: highRiskNoShows,
        action: 'Realizar contato preventivo com pacientes',
      });
    }

    return alerts;
  }

  // Métodos auxiliares privados

  private calculateRiskScore(patient: any): { score: number; factors: string[] } {
    let score = 0;
    const factors: string[] = [];

    // Análise de indicadores
    const indicators = this.getPatientIndicators(patient);
    const redCount = indicators.filter(i => i.status === 'RED').length;
    const yellowCount = indicators.filter(i => i.status === 'YELLOW').length;

    score += redCount * 15;
    score += yellowCount * 5;

    if (redCount > 0) factors.push(`${redCount} indicador(es) crítico(s)`);
    if (yellowCount > 0) factors.push(`${yellowCount} indicador(es) de atenção`);

    // Análise de visitas
    const recentVisits = patient.homeVisits?.length || 0;
    if (recentVisits === 0) {
      score += 20;
      factors.push('Sem visitas domiciliares recentes');
    }

    // Análise de consultas
    const recentAppointments = patient.appointments?.length || 0;
    if (recentAppointments === 0) {
      score += 15;
      factors.push('Sem consultas recentes');
    }

    // Análise de idade
    if (patient.age < 2 || patient.age > 70) {
      score += 10;
      factors.push('Faixa etária de risco');
    }

    // Condições crônicas
    if (patient.diabetesData) {
      score += 10;
      factors.push('Diabetes');
    }
    if (patient.hypertensionData) {
      score += 10;
      factors.push('Hipertensão');
    }

    return { score: Math.min(score, 100), factors };
  }

  private getPatientIndicators(patient: any): Array<{ code: string; status: string }> {
    const indicators: Array<{ code: string; status: string }> = [];

    if (patient.prenatalData?.prenatalIndicator) {
      const ind = patient.prenatalData.prenatalIndicator;
      indicators.push(
        { code: 'C1', status: ind.c1Status },
        { code: 'C2', status: ind.c2Status },
        { code: 'C3', status: ind.c3Status },
        { code: 'C4', status: ind.c4Status },
        { code: 'C5', status: ind.c5Status },
        { code: 'C6', status: ind.c6Status }
      );
    }

    if (patient.childcareData?.childcareIndicator) {
      const ind = patient.childcareData.childcareIndicator;
      indicators.push(
        { code: 'B1', status: ind.b1Status },
        { code: 'B2', status: ind.b2Status },
        { code: 'B3', status: ind.b3Status },
        { code: 'B4', status: ind.b4Status },
        { code: 'B5', status: ind.b5Status }
      );
    }

    if (patient.diabetesData?.diabetesIndicator) {
      const ind = patient.diabetesData.diabetesIndicator;
      indicators.push(
        { code: 'D1', status: ind.d1Status },
        { code: 'D2', status: ind.d2Status },
        { code: 'D3', status: ind.d3Status },
        { code: 'D4', status: ind.d4Status },
        { code: 'D5', status: ind.d5Status },
        { code: 'D6', status: ind.d6Status }
      );
    }

    if (patient.hypertensionData?.hypertensionIndicator) {
      const ind = patient.hypertensionData.hypertensionIndicator;
      indicators.push(
        { code: 'E1', status: ind.e1Status },
        { code: 'E2', status: ind.e2Status },
        { code: 'E3', status: ind.e3Status },
        { code: 'E4', status: ind.e4Status }
      );
    }

    return indicators;
  }

  private getNoShowRecommendation(probability: number, factors: string[]): string {
    if (probability > 60) {
      return 'Contato telefônico 48h antes + confirmação via ACS';
    } else if (probability > 40) {
      return 'Lembrete via ACS 24h antes da consulta';
    } else {
      return 'Lembrete padrão via sistema';
    }
  }

  private getRiskRecommendation(score: number, factors: string[]): string {
    if (score > 75) {
      return 'Intervenção imediata: visita domiciliar + consulta prioritária';
    } else if (score > 60) {
      return 'Acompanhamento intensivo: visita domiciliar + revisão de indicadores';
    } else {
      return 'Monitoramento ativo: agendar consulta de acompanhamento';
    }
  }

  private getIndicatorAction(code: string): string {
    const actions: Record<string, string> = {
      B1: 'Agendar 1ª consulta do recém-nascido',
      B4: 'Realizar visita domiciliar ao recém-nascido',
      C1: 'Agendar consulta pré-natal',
      C4: 'Realizar visita domiciliar à gestante',
      D1: 'Agendar consulta para diabético',
      D4: 'Realizar visita domiciliar ao diabético',
      E1: 'Agendar consulta para hipertenso',
      E4: 'Realizar visita domiciliar ao hipertenso',
    };
    return actions[code] || 'Revisar indicador e tomar ação apropriada';
  }

  private async getIndicatorStats(where: any): Promise<Record<string, number>> {
    // Simplificado - retorna percentual de indicadores verdes
    const patients = await prisma.patients.findMany({
      where,
      include: {
        prenatal_data: { include: { prenatalIndicator: true } },
        childcareData: { include: { childcare_indicators: true } },
        diabetesData: { include: { diabetes_indicators: true } },
        hypertensionData: { include: { hypertension_indicators: true } },
      },
    });

    const stats: Record<string, number> = {};
    const indicators = ['B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2'];

    for (const ind of indicators) {
      let greenCount = 0;
      let total = 0;

      for (const patient of patients) {
        const patientIndicators = this.getPatientIndicators(patient);
        const indicator = patientIndicators.find(i => i.code === ind);
        if (indicator) {
          total++;
          if (indicator.status === 'GREEN') greenCount++;
        }
      }

      stats[ind] = total > 0 ? (greenCount / total) * 100 : 0;
    }

    return stats;
  }

  private simulateHistoricalData(currentData: Record<string, number>, months: number): Record<string, number> {
    // Simular dados históricos com variação aleatória
    const historical: Record<string, number> = {};
    
    for (const key of Object.keys(currentData)) {
      const variation = (Math.random() - 0.5) * 20; // -10% a +10%
      historical[key] = Math.max(0, Math.min(100, currentData[key] + variation));
    }

    return historical;
  }

  private getTrendPrediction(trend: string, changePercentage: number): string {
    if (trend === 'IMPROVING') {
      return `Melhoria de ${Math.abs(changePercentage).toFixed(1)}% - Manter estratégias atuais`;
    } else if (trend === 'DECLINING') {
      return `Declínio de ${Math.abs(changePercentage).toFixed(1)}% - Requer intervenção`;
    } else {
      return 'Estável - Monitorar continuamente';
    }
  }
}

export default new PredictiveService();


