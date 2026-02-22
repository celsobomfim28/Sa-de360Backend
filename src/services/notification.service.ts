import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const prismaAny = prisma as any;

export enum NotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  EXAM_RESULT_READY = 'EXAM_RESULT_READY',
  EXAM_PENDING_EVALUATION = 'EXAM_PENDING_EVALUATION',
  VACCINE_DUE = 'VACCINE_DUE',
  VACCINE_OVERDUE = 'VACCINE_OVERDUE',
  INDICATOR_CRITICAL = 'INDICATOR_CRITICAL',
  HOME_VISIT_SCHEDULED = 'HOME_VISIT_SCHEDULED',
  PATIENT_PRIORITY = 'PATIENT_PRIORITY',
}

type ResponsibleUser = {
  id: string;
  role: string;
  microAreaId: string | null;
};

type CriticalPatientAlert = {
  patientId: string;
  fullName: string;
  indicators: string[];
};

export class NotificationService {
  private isLabExamModuleAvailable() {
    return (
      typeof prismaAny.labExam?.findMany === 'function' &&
      typeof prismaAny.labExamRequest?.findMany === 'function'
    );
  }

  private async createNotificationIfNotExistsRecent(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    recentMinutes?: number;
  }) {
    const recentMinutes = data.recentMinutes ?? 60;
    const recentDate = new Date(Date.now() - recentMinutes * 60 * 1000);

    const existing = await prisma.notifications.findFirst({
      where: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        createdAt: { gte: recentDate },
      },
      select: { id: true },
    });

    if (existing) {
      return null;
    }

    return this.createNotification(data);
  }

  /**
   * Criar notificação
   */
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    const notification = await prisma.notifications.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
      },
    });

    console.log('📬 Nova Notificação:', {
      id: notification.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
    });

    return notification;
  }

  /**
   * Listar notificações do usuário
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notifications.count({
      where: { userId, read: false },
    });

    return { notifications, unreadCount };
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string) {
    await prisma.notifications.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(userId: string) {
    await prisma.notifications.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  /**
   * Enviar lembrete de consulta (24h antes)
   */
  async sendAppointmentReminder(appointmentId: string) {
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        patientId: true,
        professionalId: true,
        scheduledDate: true,
      },
    });

    if (!appointment) return;

    const patient = await prisma.patients.findUnique({
      where: { id: appointment.patientId },
      select: { id: true, fullName: true, microAreaId: true },
    });

    if (!patient) return;

    // Notificar paciente (via ACS da microárea)
    const acs = await prisma.users.findFirst({
      where: {
        role: 'ACS',
        microAreaId: patient.microAreaId,
      },
    });

    if (acs) {
      await this.createNotificationIfNotExistsRecent({
        userId: acs.id,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Lembrete de Consulta',
        message: `${patient.fullName} tem consulta amanhã às ${new Date(
          appointment.scheduledDate
        ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        data: { appointmentId: appointment.id, patientId: patient.id },
        recentMinutes: 20 * 60,
      });
    }

    // Notificar profissional
    if (appointment.professionalId) {
      await this.createNotificationIfNotExistsRecent({
        userId: appointment.professionalId,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Consulta Agendada',
        message: `Consulta com ${patient.fullName} amanhã às ${new Date(
          appointment.scheduledDate
        ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        data: { appointmentId: appointment.id, patientId: patient.id },
        recentMinutes: 20 * 60,
      });
    }
  }

  /**
   * Notificar resultado de exame disponível
   */
  async notifyExamResultReady(examId: string) {
    if (!this.isLabExamModuleAvailable()) {
      logger.warn('notifyExamResultReady não executado: módulo de exames laboratoriais indisponível', {
        examId,
      });
      return;
    }

    const exam = await prismaAny.labExam.findUnique({
      where: { id: examId },
      include: {
        request: {
          include: {
            patient: { select: { fullName: true } },
          },
        },
      },
    });

    if (!exam?.request?.requestedById) return;

    await this.createNotificationIfNotExistsRecent({
      userId: exam.request.requestedById,
      type: NotificationType.EXAM_RESULT_READY,
      title: 'Resultado de Exame Disponível',
      message: `Resultado disponível para ${exam.request.patient.fullName}`,
      data: { examId: exam.id, requestId: exam.requestId },
      recentMinutes: 12 * 60,
    });
  }

  /**
   * Notificar exame pendente de avaliação
   */
  async notifyExamPendingEvaluation() {
    if (!this.isLabExamModuleAvailable()) {
      logger.warn('notifyExamPendingEvaluation não executado: módulo de exames laboratoriais indisponível');
      return;
    }

    const pendingExamsCount = await prismaAny.labExam.count({
      where: {
        resultDate: { not: null },
        evaluated: false,
      },
    });

    // Notificar médicos e enfermeiros
    const professionals = await prisma.users.findMany({
      where: {
        role: { in: ['MEDICO', 'ENFERMEIRO'] },
        isActive: true,
      },
    });

    for (const professional of professionals) {
      if (pendingExamsCount > 0) {
        await this.createNotificationIfNotExistsRecent({
          userId: professional.id,
          type: NotificationType.EXAM_PENDING_EVALUATION,
          title: 'Exames Pendentes de Avaliação',
          message: `${pendingExamsCount} exame(s) aguardando avaliação médica`,
          data: { count: pendingExamsCount },
          recentMinutes: 6 * 60,
        });
      }
    }
  }

  /**
   * Notificar vacina atrasada
   */
  async notifyVaccineOverdue(patientId: string) {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { fullName: true, microAreaId: true },
    });

    if (!patient) return;

    // Notificar ACS da microárea
    const acs = await prisma.users.findFirst({
      where: {
        role: 'ACS',
        microAreaId: patient.microAreaId,
      },
    });

    if (acs) {
      await this.createNotificationIfNotExistsRecent({
        userId: acs.id,
        type: NotificationType.VACCINE_OVERDUE,
        title: 'Vacina Atrasada',
        message: `${patient.fullName} está com vacinas atrasadas`,
        data: { patientId },
        recentMinutes: 12 * 60,
      });
    }
  }

  /**
   * Notificar indicador crítico
   */
  async notifyIndicatorCritical(patientId: string, indicator: string) {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { fullName: true, microAreaId: true },
    });

    if (!patient) return;

    // Notificar ACS da microárea
    const acs = await prisma.users.findFirst({
      where: {
        role: 'ACS',
        microAreaId: patient.microAreaId,
      },
    });

    if (acs) {
      await this.createNotificationIfNotExistsRecent({
        userId: acs.id,
        type: NotificationType.INDICATOR_CRITICAL,
        title: 'Indicador Crítico',
        message: `${patient.fullName} - Indicador ${indicator} em status crítico`,
        data: { patientId, indicator },
        recentMinutes: 12 * 60,
      });
    }

    // Notificar enfermeiros e médicos
    const professionals = await prisma.users.findMany({
      where: {
        role: { in: ['MEDICO', 'ENFERMEIRO'] },
        isActive: true,
      },
      take: 5,
    });

    for (const professional of professionals) {
      await this.createNotificationIfNotExistsRecent({
        userId: professional.id,
        type: NotificationType.INDICATOR_CRITICAL,
        title: 'Indicador Crítico',
        message: `${patient.fullName} - Indicador ${indicator} requer atenção`,
        data: { patientId, indicator },
        recentMinutes: 12 * 60,
      });
    }
  }

  /**
   * Notificar paciente prioritário
   */
  async notifyPriorityPatient(patientId: string, reason: string) {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { fullName: true, microAreaId: true },
    });

    if (!patient) return;

    // Notificar ACS da microárea
    const acs = await prisma.users.findFirst({
      where: {
        role: 'ACS',
        microAreaId: patient.microAreaId,
      },
    });

    if (acs) {
      await this.createNotificationIfNotExistsRecent({
        userId: acs.id,
        type: NotificationType.PATIENT_PRIORITY,
        title: 'Paciente Prioritário',
        message: `${patient.fullName} - ${reason}`,
        data: { patientId, reason },
        recentMinutes: 12 * 60,
      });
    }
  }

  private getPatientCriticalIndicators(patient: any): string[] {
    const indicators: string[] = [];

    if (patient.prenatal_data?.prenatal_indicators) {
      const p = patient.prenatal_data.prenatal_indicators;
      if (p.c1Status === 'RED') indicators.push('C1');
      if (p.c2Status === 'RED') indicators.push('C2');
      if (p.c3Status === 'RED') indicators.push('C3');
      if (p.c4Status === 'RED') indicators.push('C4');
      if (p.c5Status === 'RED') indicators.push('C5');
      if (p.c6Status === 'RED') indicators.push('C6');
    }

    if (patient.childcare_indicators) {
      const c = patient.childcare_indicators;
      if (c.b1Status === 'RED') indicators.push('B1');
      if (c.b2Status === 'RED') indicators.push('B2');
      if (c.b3Status === 'RED') indicators.push('B3');
      if (c.b4Status === 'RED') indicators.push('B4');
      if (c.b5Status === 'RED') indicators.push('B5');
    }

    if (patient.diabetes_indicators) {
      const d = patient.diabetes_indicators;
      if (d.d1Status === 'RED') indicators.push('D1');
      if (d.d2Status === 'RED') indicators.push('D2');
      if (d.d3Status === 'RED') indicators.push('D3');
      if (d.d4Status === 'RED') indicators.push('D4');
      if (d.d5Status === 'RED') indicators.push('D5');
      if (d.d6Status === 'RED') indicators.push('D6');
    }

    if (patient.hypertension_indicators) {
      const h = patient.hypertension_indicators;
      if (h.e1Status === 'RED') indicators.push('E1');
      if (h.e2Status === 'RED') indicators.push('E2');
      if (h.e3Status === 'RED') indicators.push('E3');
      if (h.e4Status === 'RED') indicators.push('E4');
    }

    if (patient.elderly_indicators) {
      const e = patient.elderly_indicators;
      if (e.f1Status === 'RED') indicators.push('F1');
      if (e.f2Status === 'RED') indicators.push('F2');
    }

    if (patient.woman_health_indicators) {
      const w = patient.woman_health_indicators;
      if (w.g1Status === 'RED') indicators.push('G1');
      if (w.g2Status === 'RED') indicators.push('G2');
    }

    return indicators;
  }

  private async getCriticalPatientsByResponsibility(user: ResponsibleUser): Promise<CriticalPatientAlert[]> {
    const where: any = {
      deletedAt: null,
      OR: [
        {
          prenatal_data: {
            prenatal_indicators: {
              OR: [
                { c1Status: 'RED' },
                { c2Status: 'RED' },
                { c3Status: 'RED' },
                { c4Status: 'RED' },
                { c5Status: 'RED' },
                { c6Status: 'RED' },
              ],
            },
          },
        },
        {
          childcare_indicators: {
            OR: [
              { b1Status: 'RED' },
              { b2Status: 'RED' },
              { b3Status: 'RED' },
              { b4Status: 'RED' },
              { b5Status: 'RED' },
            ],
          },
        },
        {
          diabetes_indicators: {
            OR: [
              { d1Status: 'RED' },
              { d2Status: 'RED' },
              { d3Status: 'RED' },
              { d4Status: 'RED' },
              { d5Status: 'RED' },
              { d6Status: 'RED' },
            ],
          },
        },
        {
          hypertension_indicators: {
            OR: [{ e1Status: 'RED' }, { e2Status: 'RED' }, { e3Status: 'RED' }, { e4Status: 'RED' }],
          },
        },
        {
          elderly_indicators: {
            OR: [{ f1Status: 'RED' }, { f2Status: 'RED' }],
          },
        },
        {
          woman_health_indicators: {
            OR: [{ g1Status: 'RED' }, { g2Status: 'RED' }],
          },
        },
      ],
    };

    if (user.microAreaId) {
      where.microAreaId = user.microAreaId;
    } else if (user.role === 'ACS') {
      return [];
    }

    const patients = await prisma.patients.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        prenatal_data: { select: { prenatal_indicators: true } },
        childcare_indicators: true,
        diabetes_indicators: true,
        hypertension_indicators: true,
        elderly_indicators: true,
        woman_health_indicators: true,
      },
      orderBy: { fullName: 'asc' },
      take: 100,
    });

    return patients
      .map((patient) => ({
        patientId: patient.id,
        fullName: patient.fullName,
        indicators: this.getPatientCriticalIndicators(patient),
      }))
      .filter((patient) => patient.indicators.length > 0);
  }

  async notifyCriticalPointsByResponsibility() {
    const users = await prisma.users.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        role: { in: ['ACS', 'TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'MEDICO'] },
      },
      select: {
        id: true,
        role: true,
        microAreaId: true,
      },
    });

    let notificationsCreated = 0;

    for (const user of users) {
      const criticalPatients = await this.getCriticalPatientsByResponsibility(user);

      if (criticalPatients.length === 0) continue;

      const message = `Você tem ${criticalPatients.length} paciente(s) com pontos críticos sob sua responsabilidade.`;
      const created = await this.createNotificationIfNotExistsRecent({
        userId: user.id,
        type: NotificationType.INDICATOR_CRITICAL,
        title: 'Alerta de pontos críticos',
        message,
        data: {
          count: criticalPatients.length,
          patients: criticalPatients.map((p) => ({
            id: p.patientId,
            fullName: p.fullName,
            indicators: p.indicators,
          })),
        },
        recentMinutes: 6 * 60,
      });

      if (created) notificationsCreated += 1;
    }

    return { usersEvaluated: users.length, notificationsCreated };
  }

  /**
   * Verificar e enviar notificações automáticas
   * Este método deve ser executado periodicamente (cron job)
   */
  async sendAutomaticNotifications() {
    logger.info('🔔 Verificando notificações automáticas...');

    // 1. Lembretes de consultas (24h antes)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const upcomingAppointments = await prisma.appointments.findMany({
      where: {
        scheduledDate: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    for (const appointment of upcomingAppointments) {
      await this.sendAppointmentReminder(appointment.id);
    }

    // 2. Exames pendentes de avaliação
    await this.notifyExamPendingEvaluation();

    // 3. Vacinas atrasadas
    const patientsWithDelayedVaccines = await prisma.patients.findMany({
      where: {
        isChild: true,
        childcare_indicators: {
          vaccineStatus: 'DELAYED',
        },
      },
      take: 20,
    });

    for (const patient of patientsWithDelayedVaccines) {
      await this.notifyVaccineOverdue(patient.id);
    }

    // 4. Indicadores críticos
    const criticalIndicators = await prisma.prenatal_indicators.findMany({
      where: {
        OR: [
          { c1Status: 'RED' },
          { c2Status: 'RED' },
          { c3Status: 'RED' },
          { c4Status: 'RED' },
          { c5Status: 'RED' },
          { c6Status: 'RED' },
        ],
      },
      include: {
        prenatal_data: {
          select: { patientId: true },
        },
      },
      take: 10,
    });

    for (const indicator of criticalIndicators) {
      const criticalFields: string[] = [];
      if (indicator.c1Status === 'RED') criticalFields.push('C1');
      if (indicator.c2Status === 'RED') criticalFields.push('C2');
      if (indicator.c3Status === 'RED') criticalFields.push('C3');
      if (indicator.c4Status === 'RED') criticalFields.push('C4');
      if (indicator.c5Status === 'RED') criticalFields.push('C5');
      if (indicator.c6Status === 'RED') criticalFields.push('C6');

      await this.notifyIndicatorCritical(
        indicator.prenatal_data.patientId,
        criticalFields.join(', ')
      );
    }

    // 5. Resumo de pontos críticos por responsabilidade
    const responsibilitySummary = await this.notifyCriticalPointsByResponsibility();

    logger.info('✅ Notificações automáticas enviadas', {
      upcomingAppointments: upcomingAppointments.length,
      patientsWithDelayedVaccines: patientsWithDelayedVaccines.length,
      prenatalCriticalPatients: criticalIndicators.length,
      responsibilityNotificationsCreated: responsibilitySummary.notificationsCreated,
      usersEvaluated: responsibilitySummary.usersEvaluated,
    });

    return {
      upcomingAppointments: upcomingAppointments.length,
      patientsWithDelayedVaccines: patientsWithDelayedVaccines.length,
      prenatalCriticalPatients: criticalIndicators.length,
      responsibilityNotificationsCreated: responsibilitySummary.notificationsCreated,
      usersEvaluated: responsibilitySummary.usersEvaluated,
    };
  }
}








