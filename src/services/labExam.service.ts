import { PrismaClient } from '@prisma/client';

type LabExamType = string;
type ExamPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
type ExamRequestStatus = 'PENDING' | 'COLLECTED' | 'IN_ANALYSIS' | 'COMPLETED' | 'CANCELLED';
type ExamInterpretation = 'NORMAL' | 'ALTERED' | 'CRITICAL';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

export class LabExamService {
  private ensureLabExamModuleAvailable() {
    const hasRequestsModel = typeof prismaAny.labExamRequest?.findMany === 'function';
    const hasExamModel = typeof prismaAny.labExam?.findMany === 'function';

    if (!hasRequestsModel || !hasExamModel) {
      throw new Error('Módulo de exames laboratoriais não está configurado no banco de dados atual');
    }
  }

  /**
   * Criar solicitação de exames
   */
  async createExamRequest(data: {
    patientId: string;
    requestedById: string;
    examTypes: LabExamType[];
    priority?: ExamPriority;
    clinicalInfo?: string;
  }) {
    this.ensureLabExamModuleAvailable();

    const request = await prismaAny.labExamRequest.create({
      data: {
        patientId: data.patientId,
        requestedById: data.requestedById,
        priority: data.priority || 'ROUTINE',
        clinicalInfo: data.clinicalInfo,
        exams: {
          create: data.examTypes.map(examType => ({
            examType
          }))
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            cns: true,
            birthDate: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        exams: true
      }
    });

    return request;
  }

  /**
   * Listar solicitações de exames
   */
  async listExamRequests(filters?: {
    patientId?: string;
    status?: ExamRequestStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    this.ensureLabExamModuleAvailable();

    const where: any = {};

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.requestDate = {};
      if (filters.startDate) {
        where.requestDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.requestDate.lte = filters.endDate;
      }
    }

    return await prismaAny.labExamRequest.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            cns: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        exams: {
          include: {
            evaluatedBy: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        requestDate: 'desc'
      }
    });
  }

  /**
   * Obter detalhes de uma solicitação
   */
  async getExamRequest(requestId: string) {
    this.ensureLabExamModuleAvailable();

    const request = await prismaAny.labExamRequest.findUnique({
      where: { id: requestId },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            cns: true,
            birthDate: true,
            sex: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        exams: {
          include: {
            evaluatedBy: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!request) {
      throw new Error('Solicitação de exame não encontrada');
    }

    return request;
  }

  /**
   * Registrar coleta de exame
   */
  async registerCollection(examId: string, data: {
    collectionDate: Date;
    collectedBy: string;
  }) {
    this.ensureLabExamModuleAvailable();

    const exam = await prismaAny.labExam.update({
      where: { id: examId },
      data: {
        collectionDate: data.collectionDate,
        collectedBy: data.collectedBy
      },
      include: {
        request: true
      }
    });

    // Atualizar status da solicitação se todos os exames foram coletados
    const allExams = await prismaAny.labExam.findMany({
      where: { requestId: exam.requestId }
    });

    const allCollected = allExams.every((e: any) => e.collectionDate !== null);

    if (allCollected) {
      await prismaAny.labExamRequest.update({
        where: { id: exam.requestId },
        data: { status: 'COLLECTED' }
      });
    }

    return exam;
  }

  /**
   * Registrar resultado de exame
   */
  async registerResult(examId: string, data: {
    resultDate: Date;
    result?: any;
    resultText?: string;
    referenceRange?: string;
    interpretation?: ExamInterpretation;
  }) {
    this.ensureLabExamModuleAvailable();

    const exam = await prismaAny.labExam.update({
      where: { id: examId },
      data: {
        resultDate: data.resultDate,
        result: data.result,
        resultText: data.resultText,
        referenceRange: data.referenceRange,
        interpretation: data.interpretation
      },
      include: {
        request: true
      }
    });

    // Atualizar status da solicitação se todos os exames têm resultado
    const allExams = await prismaAny.labExam.findMany({
      where: { requestId: exam.requestId }
    });

    const allWithResults = allExams.every((e: any) => e.resultDate !== null);

    if (allWithResults) {
      await prismaAny.labExamRequest.update({
        where: { id: exam.requestId },
        data: { status: 'IN_ANALYSIS' }
      });
    }

    return exam;
  }

  /**
   * Avaliar resultado de exame
   */
  async evaluateExam(examId: string, data: {
    evaluatedById: string;
    observations?: string;
  }) {
    this.ensureLabExamModuleAvailable();

    const exam = await prismaAny.labExam.update({
      where: { id: examId },
      data: {
        evaluated: true,
        evaluatedById: data.evaluatedById,
        evaluatedAt: new Date(),
        observations: data.observations
      },
      include: {
        request: true,
        evaluatedBy: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    // Atualizar status da solicitação se todos os exames foram avaliados
    const allExams = await prismaAny.labExam.findMany({
      where: { requestId: exam.requestId }
    });

    const allEvaluated = allExams.every((e: any) => e.evaluated);

    if (allEvaluated) {
      await prismaAny.labExamRequest.update({
        where: { id: exam.requestId },
        data: { status: 'COMPLETED' }
      });
    }

    return exam;
  }

  /**
   * Cancelar solicitação de exame
   */
  async cancelExamRequest(requestId: string) {
    this.ensureLabExamModuleAvailable();

    return await prismaAny.labExamRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' }
    });
  }

  /**
   * Obter histórico de exames do paciente
   */
  async getPatientExamHistory(patientId: string, examType?: LabExamType) {
    this.ensureLabExamModuleAvailable();

    const where: any = {
      patientId
    };

    const requests = await prismaAny.labExamRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        },
        exams: {
          where: examType ? { examType } : undefined,
          include: {
            evaluatedBy: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        requestDate: 'desc'
      }
    });

    return requests;
  }

  /**
   * Obter exames pendentes de avaliação
   */
  async getPendingEvaluations() {
    this.ensureLabExamModuleAvailable();

    const exams = await prismaAny.labExam.findMany({
      where: {
        resultDate: { not: null },
        evaluated: false
      },
      include: {
        request: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                cpf: true,
                cns: true
              }
            },
            requestedBy: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        resultDate: 'asc'
      }
    });

    return exams;
  }

  /**
   * Obter estatísticas de exames
   */
  async getExamStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    this.ensureLabExamModuleAvailable();

    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.requestDate = {};
      if (filters.startDate) {
        where.requestDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.requestDate.lte = filters.endDate;
      }
    }

    const [
      totalRequests,
      pendingRequests,
      collectedRequests,
      inAnalysisRequests,
      completedRequests,
      cancelledRequests,
      pendingEvaluations
    ] = await Promise.all([
      prismaAny.labExamRequest.count({ where }),
      prismaAny.labExamRequest.count({ where: { ...where, status: 'PENDING' } }),
      prismaAny.labExamRequest.count({ where: { ...where, status: 'COLLECTED' } }),
      prismaAny.labExamRequest.count({ where: { ...where, status: 'IN_ANALYSIS' } }),
      prismaAny.labExamRequest.count({ where: { ...where, status: 'COMPLETED' } }),
      prismaAny.labExamRequest.count({ where: { ...where, status: 'CANCELLED' } }),
      prismaAny.labExam.count({
        where: {
          resultDate: { not: null },
          evaluated: false
        }
      })
    ]);

    return {
      totalRequests,
      byStatus: {
        pending: pendingRequests,
        collected: collectedRequests,
        inAnalysis: inAnalysisRequests,
        completed: completedRequests,
        cancelled: cancelledRequests
      },
      pendingEvaluations
    };
  }
}
