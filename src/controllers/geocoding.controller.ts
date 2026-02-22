import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/database';
import geocodingService from '../services/geocoding.service';

export class GeocodingController {
  private normalizeParam(value: unknown): string | null {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return null;
  }

  // POST /geocoding/patient/:patientId
  async geocodePatient(req: AuthRequest, res: Response) {
    try {
      const patientId = this.normalizeParam(req.params.patientId);

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PATIENT_ID',
            message: 'Parâmetro patientId inválido',
          },
        });
      }

      // ACS só pode geocodificar pacientes da própria microárea
      if (req.user?.role === 'ACS') {
        if (!req.user.microAreaId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'NO_MICROAREA_ASSIGNED',
              message: 'ACS sem microárea atribuída',
            },
          });
        }

        const patient = await prisma.patients.findUnique({
          where: { id: patientId },
          select: { microAreaId: true },
        });

        if (!patient) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'PATIENT_NOT_FOUND',
              message: 'Paciente não encontrado',
            },
          });
        }

        if (patient.microAreaId !== req.user.microAreaId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'MICROAREA_ACCESS_DENIED',
              message: 'Você não tem permissão para geocodificar pacientes de outra microárea',
            },
          });
        }
      }

      const success = await geocodingService.geocodePatient(patientId);

      if (success) {
        return res.json({
          success: true,
          message: 'Paciente geocodificado com sucesso',
        });
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 'GEOCODING_FAILED',
            message: 'Não foi possível geocodificar o endereço do paciente',
          },
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // POST /geocoding/batch
  async geocodeBatch(req: AuthRequest, res: Response) {
    try {
      const { limit, microAreaId } = req.body as { limit?: number; microAreaId?: string };

      let result;

      // ACS: sempre restringe à microárea do próprio usuário
      if (req.user?.role === 'ACS') {
        if (!req.user.microAreaId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'NO_MICROAREA_ASSIGNED',
              message: 'ACS sem microárea atribuída',
            },
          });
        }

        if (microAreaId && microAreaId !== req.user.microAreaId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'MICROAREA_ACCESS_DENIED',
              message: 'Você não tem permissão para geocodificar pacientes de outra microárea',
            },
          });
        }

        result = await geocodingService.geocodeMicroArea(req.user.microAreaId, limit);
      } else if (microAreaId) {
        result = await geocodingService.geocodeMicroArea(microAreaId, limit);
      } else {
        result = await geocodingService.geocodeAllPatients(limit);
      }

      return res.json({
        success: true,
        data: result,
        message: `Geocodificação concluída: ${result.success} sucessos, ${result.failed} falhas`,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // GET /geocoding/stats
  async getStats(req: AuthRequest, res: Response) {
    try {
      const microAreaId = req.user?.role === 'ACS' ? req.user.microAreaId : undefined;

      if (req.user?.role === 'ACS' && !microAreaId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NO_MICROAREA_ASSIGNED',
            message: 'ACS sem microárea atribuída',
          },
        });
      }

      const stats = await geocodingService.getGeocodingStats(microAreaId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }

  // POST /geocoding/reset
  async resetGeocoding(req: AuthRequest, res: Response) {
    try {
      const { microAreaId } = req.body as { microAreaId?: string };

      let targetMicroAreaId: string | undefined = microAreaId;

      // ACS: sempre restringe à própria microárea
      if (req.user?.role === 'ACS') {
        if (!req.user.microAreaId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'NO_MICROAREA_ASSIGNED',
              message: 'ACS sem microárea atribuída',
            },
          });
        }

        if (microAreaId && microAreaId !== req.user.microAreaId) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'MICROAREA_ACCESS_DENIED',
              message: 'Você não tem permissão para resetar geocodificação de outra microárea',
            },
          });
        }

        targetMicroAreaId = req.user.microAreaId;
      }

      const result = await geocodingService.resetGeocoding(targetMicroAreaId);

      return res.json({
        success: true,
        data: result,
        message: `Reset de geocodificação concluído: ${result.resetCount} pacientes atualizados`,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  }
}

export default new GeocodingController();
