import prisma from '../config/database';

interface TeleconsultationData {
  patientId: string;
  professionalId: string;
  scheduledDate: Date;
  duration: number;
  type: 'VIDEO' | 'CHAT' | 'PHONE';
  reason: string;
  notes?: string;
}

interface PrescriptionData {
  patientId: string;
  professionalId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  observations?: string;
}

export class TelemedicineService {
  // Agendar teleconsulta
  async scheduleTeleconsultation(data: TeleconsultationData) {
    // Verificar disponibilidade do profissional
    const conflictingAppointment = await prisma.appointments.findFirst({
      where: {
        professionalId: data.professionalId,
        appointmentDate: data.scheduledDate,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    if (conflictingAppointment) {
      throw new Error('Profissional já possui consulta agendada neste horário');
    }

    // Criar agendamento
    const appointment = await prisma.appointments.create({
      data: {
        patientId: data.patientId,
        professionalId: data.professionalId,
        appointmentDate: data.scheduledDate,
        appointmentType: 'TELECONSULTATION',
        status: 'SCHEDULED',
        observations: `Tipo: ${data.type} | Motivo: ${data.reason}${data.notes ? ` | Notas: ${data.notes}` : ''}`,
      },
      include: {
        patient: true,
        professional: true,
      },
    });

    return {
      id: appointment.id,
      patient: appointment.patient.fullName,
      professional: appointment.professional.fullName,
      scheduledDate: appointment.appointmentDate,
      type: data.type,
      status: appointment.status,
    };
  }

  // Listar teleconsultas
  async listTeleconsultations(filters: {
    professionalId?: string;
    patientId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      appointmentType: 'TELECONSULTATION',
    };

    if (filters.professionalId) where.professionalId = filters.professionalId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    
    if (filters.startDate || filters.endDate) {
      where.appointmentDate = {};
      if (filters.startDate) where.appointmentDate.gte = filters.startDate;
      if (filters.endDate) where.appointmentDate.lte = filters.endDate;
    }

    const appointments = await prisma.appointments.findMany({
      where,
      include: {
        patient: true,
        professional: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return appointments.map(apt => ({
      id: apt.id,
      patient: apt.patient.fullName,
      professional: apt.professional.fullName,
      scheduledDate: apt.appointmentDate,
      status: apt.status,
      observations: apt.observations,
    }));
  }

  // Gerar prescrição digital
  async generatePrescription(data: PrescriptionData) {
    const patient = await prisma.patients.findUnique({
      where: { id: data.patientId },
    });

    const professional = await prisma.users.findUnique({
      where: { id: data.professionalId },
    });

    if (!patient || !professional) {
      throw new Error('Paciente ou profissional não encontrado');
    }

    // Gerar código único da prescrição
    const prescriptionCode = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Formatar prescrição
    const prescription = {
      code: prescriptionCode,
      date: new Date().toISOString(),
      patient: {
        name: patient.fullName,
        cpf: patient.cpf,
        birthDate: patient.birthDate,
      },
      professional: {
        name: professional.fullName,
        role: professional.role,
        registration: professional.cpf, // Em produção, usar CRM/COREN
      },
      medications: data.medications,
      observations: data.observations,
      digitalSignature: `ASSINADO DIGITALMENTE POR ${professional.fullName}`,
    };

    // Em produção, salvar no banco e gerar PDF
    return prescription;
  }

  // Gerar atestado digital
  async generateMedicalCertificate(data: {
    patientId: string;
    professionalId: string;
    days: number;
    cid10?: string;
    observations?: string;
  }) {
    const patient = await prisma.patients.findUnique({
      where: { id: data.patientId },
    });

    const professional = await prisma.users.findUnique({
      where: { id: data.professionalId },
    });

    if (!patient || !professional) {
      throw new Error('Paciente ou profissional não encontrado');
    }

    const certificateCode = `AT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const issueDate = new Date();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + data.days);

    const certificate = {
      code: certificateCode,
      issueDate: issueDate.toISOString(),
      patient: {
        name: patient.fullName,
        cpf: patient.cpf,
      },
      professional: {
        name: professional.fullName,
        role: professional.role,
        registration: professional.cpf,
      },
      period: {
        days: data.days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      cid10: data.cid10,
      observations: data.observations,
      digitalSignature: `ASSINADO DIGITALMENTE POR ${professional.fullName}`,
    };

    return certificate;
  }

  // Estatísticas de telemedicina
  async getTelemedicineStats(filters: {
    professionalId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      appointmentType: 'TELECONSULTATION',
    };

    if (filters.professionalId) where.professionalId = filters.professionalId;
    
    if (filters.startDate || filters.endDate) {
      where.appointmentDate = {};
      if (filters.startDate) where.appointmentDate.gte = filters.startDate;
      if (filters.endDate) where.appointmentDate.lte = filters.endDate;
    }

    const total = await prisma.appointments.count({ where });
    
    const completed = await prisma.appointments.count({
      where: { ...where, status: 'COMPLETED' },
    });

    const scheduled = await prisma.appointments.count({
      where: { ...where, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
    });

    const cancelled = await prisma.appointments.count({
      where: { ...where, status: 'CANCELLED' },
    });

    const noShow = await prisma.appointments.count({
      where: { ...where, status: 'NO_SHOW' },
    });

    return {
      total,
      completed,
      scheduled,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}

export default new TelemedicineService();



