import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

interface CreateAppointmentInput {
    patientId: string;
    professionalId?: string;
    scheduledDate: Date;
    type: 'PRENATAL' | 'CHILDCARE' | 'HYPERTENSION' | 'DIABETES' | 'ROUTINE' | 'POSTPARTUM' | 'ELDERLY_CARE' | 'MEDICAL' | 'NURSING' | 'DENTAL' | 'OTHER';
    reason?: string;
    observations?: string;
}

interface UpdateAppointmentInput {
    scheduledDate?: Date;
    observations?: string;
    status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'ABSENT' | 'CANCELLED' | 'RESCHEDULED';
}

interface MarkAbsenceInput {
    absenceReason: string;
    reportedById: string;
}

interface GiveNoticeInput {
    acsId: string;
}

export class AppointmentService {
    /**
     * Criar nova consulta agendada
     */
    async create(data: CreateAppointmentInput) {
        // Verificar se paciente existe
        const patient = await prisma.patients.findUnique({
            where: { id: data.patientId },
        });

        if (!patient) {
            throw new AppError(404, 'Paciente não encontrado', 'PATIENT_NOT_FOUND');
        }

        // Se professionalId não foi fornecido, deixar como null (será atribuído depois)
        if (data.professionalId) {
            const professional = await prisma.users.findUnique({
                where: { id: data.professionalId },
            });

            if (!professional) {
                throw new AppError(404, 'Profissional não encontrado', 'PROFESSIONAL_NOT_FOUND');
            }
        }

        // Criar consulta
        const appointment = await prisma.appointments.create({
            data: {
                patientId: data.patientId,
                professionalId: data.professionalId || null,
                scheduledDate: data.scheduledDate,
                type: data.type,
                reason: data.reason,
                observations: data.observations,
                status: 'SCHEDULED',
            },
            include: {
                patients: {
                    select: {
                        id: true,
                        fullName: true,
                        cpf: true,
                        birthDate: true,
                        micro_areas: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                users_appointments_professionalIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
        });

        logger.info(`Consulta criada: ${appointment.id} para paciente ${patient.fullName}`);

        return this.formatAppointmentResponse(appointment);
    }

    /**
     * Listar consultas com filtros
     */
    async list(filters: {
        date?: Date;
        professionalId?: string;
        patientId?: string;
        microAreaId?: string;
        status?: string;
        type?: string;
        page: number;
        limit: number;
    }) {
        const { date, professionalId, patientId, microAreaId, status, type, page, limit } = filters;

        const where: any = {};

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            where.scheduledDate = {
                gte: startOfDay,
                lte: endOfDay,
            };
        }

        if (professionalId) {
            where.professionalId = professionalId;
        }

        if (patientId) {
            where.patientId = patientId;
        }

        if (microAreaId) {
            where.patients = {
                microAreaId,
            };
        }

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = type;
        }

        const [appointments, total] = await Promise.all([
            prisma.appointments.findMany({
                where,
                include: {
                    patients: {
                        select: {
                            id: true,
                            fullName: true,
                            cpf: true,
                            birthDate: true,
                            micro_areas: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    users_appointments_professionalIdTousers: {
                        select: {
                            id: true,
                            fullName: true,
                            role: true,
                        },
                    },
                    users_appointments_noticeGivenByIdTousers: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { scheduledDate: 'asc' },
            }),
            prisma.appointments.count({ where }),
        ]);

        return {
            data: appointments.map((a) => this.formatAppointmentResponse(a)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Buscar consulta por ID
     */
    async getById(id: string) {
        const appointment = await prisma.appointments.findUnique({
            where: { id },
            include: {
                patients: {
                    select: {
                        id: true,
                        fullName: true,
                        cpf: true,
                        birthDate: true,
                        primaryPhone: true,
                        micro_areas: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                users_appointments_professionalIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
                users_appointments_noticeGivenByIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                users_appointments_absenceReportedByIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        if (!appointment) {
            throw new AppError(404, 'Consulta não encontrada', 'APPOINTMENT_NOT_FOUND');
        }

        return this.formatAppointmentResponse(appointment);
    }

    /**
     * Atualizar consulta
     */
    async update(id: string, data: UpdateAppointmentInput) {
        const appointment = await prisma.appointments.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new AppError(404, 'Consulta não encontrada', 'APPOINTMENT_NOT_FOUND');
        }

        const updated = await prisma.appointments.update({
            where: { id },
            data,
            include: {
                patients: {
                    select: {
                        id: true,
                        fullName: true,
                        cpf: true,
                        birthDate: true,
                        micro_areas: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                users_appointments_professionalIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
        });

        logger.info(`Consulta atualizada: ${id}`);

        return this.formatAppointmentResponse(updated);
    }

    /**
     * Registrar aviso de consulta pelo ACS
     */
    async giveNotice(id: string, data: GiveNoticeInput) {
        const appointment = await prisma.appointments.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new AppError(404, 'Consulta não encontrada', 'APPOINTMENT_NOT_FOUND');
        }

        const updated = await prisma.appointments.update({
            where: { id },
            data: {
                noticeGiven: true,
                noticeGivenAt: new Date(),
                noticeGivenById: data.acsId,
                status: 'CONFIRMED',
            },
            include: {
                patients: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                users_appointments_noticeGivenByIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        logger.info(`Aviso de consulta registrado por ${data.acsId} para consulta ${id}`);

        return this.formatAppointmentResponse(updated);
    }

    /**
     * Marcar paciente como faltoso
     */
    async markAbsence(id: string, data: MarkAbsenceInput) {
        const appointment = await prisma.appointments.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new AppError(404, 'Consulta não encontrada', 'APPOINTMENT_NOT_FOUND');
        }

        const updated = await prisma.appointments.update({
            where: { id },
            data: {
                status: 'ABSENT',
                absenceReason: data.absenceReason,
                absenceReportedById: data.reportedById,
                absenceReportedAt: new Date(),
            },
            include: {
                patients: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                users_appointments_absenceReportedByIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        logger.warn(`Falta registrada para consulta ${id}: ${data.absenceReason}`);

        return this.formatAppointmentResponse(updated);
    }

    /**
     * Marcar consulta como realizada
     */
    async markCompleted(id: string) {
        const appointment = await prisma.appointments.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new AppError(404, 'Consulta não encontrada', 'APPOINTMENT_NOT_FOUND');
        }

        const updated = await prisma.appointments.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                checkedInAt: new Date(),
            },
            include: {
                patients: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        logger.info(`Consulta marcada como realizada: ${id}`);

        return this.formatAppointmentResponse(updated);
    }

    /**
     * Listar consultas do dia para o ACS (agenda do dia)
     */
    async getDailyAgenda(acsId: string, date: Date) {
        // Buscar microárea do ACS
        const acs = await prisma.users.findUnique({
            where: { id: acsId },
            include: {
                micro_areas: true,
            },
        });

        if (!acs || !acs.micro_areas) {
            throw new AppError(404, 'ACS ou microárea não encontrada', 'ACS_NOT_FOUND');
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointments.findMany({
            where: {
                scheduledDate: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                patients: {
                    microAreaId: acs.micro_areas.id,
                },
                status: {
                    in: ['SCHEDULED', 'CONFIRMED'],
                },
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
                        referencePoint: true,
                        primaryPhone: true,
                    },
                },
                users_appointments_professionalIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
            orderBy: { scheduledDate: 'asc' },
        });

        return appointments.map((a) => this.formatAppointmentResponse(a));
    }

    /**
     * Listar pacientes faltosos (para busca ativa)
     */
    async getAbsentPatients(microAreaId?: string) {
        const where: any = {
            status: 'ABSENT',
            absenceReportedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
            },
        };

        if (microAreaId) {
            where.patients = {
                microAreaId,
            };
        }

        const appointments = await prisma.appointments.findMany({
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
                        primaryPhone: true,
                        micro_areas: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                users_appointments_professionalIdTousers: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                    },
                },
            },
            orderBy: { absenceReportedAt: 'desc' },
        });

        return appointments.map((a) => this.formatAppointmentResponse(a));
    }

    private formatAppointmentResponse(appointment: any) {
        return {
            id: appointment.id,
            patients: appointment.patients,
            users_appointments_professionalIdTousers: appointment.users_appointments_professionalIdTousers,
            scheduledDate: appointment.scheduledDate,
            type: appointment.type,
            status: appointment.status,
            observations: appointment.observations,
            checkedInAt: appointment.checkedInAt,
            noticeGiven: appointment.noticeGiven,
            noticeGivenAt: appointment.noticeGivenAt,
            users_appointments_noticeGivenByIdTousers: appointment.users_appointments_noticeGivenByIdTousers,
            absenceReason: appointment.absenceReason,
            users_appointments_absenceReportedByIdTousers: appointment.users_appointments_absenceReportedByIdTousers,
            absenceReportedAt: appointment.absenceReportedAt,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt,
        };
    }
}






