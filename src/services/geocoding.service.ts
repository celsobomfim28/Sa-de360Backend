import axios from 'axios';
import {prisma} from '../config/database';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export class GeocodingService {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly userAgent = 'Saude360PSF/1.0';
  private readonly delayBetweenRequests = 1000; // 1 segundo entre requisições (política do Nominatim)

  /**
   * Geocodificar um endereço completo
   */
  async geocodeAddress(address: {
    street: string;
    number: string;
    neighborhood: string;
    zipCode: string;
    city?: string;
    state?: string;
  }): Promise<GeocodeResult | null> {
    try {
      const normalizedCity = address.city || 'Riachuelo';
      const normalizedState = address.state || 'Sergipe';
      const normalizedZipCode = '49130-000';

      // Construir query de endereço
      const fullAddress = `${address.street}, ${normalizedZipCode}, ${normalizedCity}, ${normalizedState}, Brasil`;

      console.log('🌍 Geocodificando endereço:', fullAddress);

      const response = await axios.get(this.nominatimUrl, {
        params: {
          q: fullAddress,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'br',
        },
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 10000,
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        console.log('✅ Coordenadas encontradas:', result.lat, result.lon);
        
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
        };
      }

      console.log('⚠️ Nenhuma coordenada encontrada para:', fullAddress);
      return null;
    } catch (error: any) {
      console.error('❌ Erro ao geocodificar endereço:', error.message);
      return null;
    }
  }

  /**
   * Geocodificar um paciente específico
   */
  async geocodePatient(patientId: string): Promise<boolean> {
    try {
      const patient = await prisma.patients.findUnique({
        where: { id: patientId },
        select: {
          id: true,
          street: true,
          number: true,
          neighborhood: true,
          zipCode: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!patient) {
        console.log('❌ Paciente não encontrado:', patientId);
        return false;
      }

      // Se já tem coordenadas, não geocodificar novamente
      if (patient.latitude && patient.longitude) {
        console.log('ℹ️ Paciente já possui coordenadas');
        return true;
      }

      const result = await this.geocodeAddress({
        street: patient.street,
        number: patient.number,
        neighborhood: patient.neighborhood,
        zipCode: patient.zipCode,
      });

      if (result) {
        await prisma.patients.update({
          where: { id: patientId },
          data: {
            latitude: result.latitude,
            longitude: result.longitude,
            geocodedAt: new Date(),
          },
        });

        console.log('✅ Paciente geocodificado com sucesso');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('❌ Erro ao geocodificar paciente:', error.message);
      return false;
    }
  }

  /**
   * Geocodificar todos os pacientes sem coordenadas
   */
  async geocodeAllPatients(limit?: number): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    try {
      const patients = await prisma.patients.findMany({
        where: {
          deletedAt: null,
          OR: [
            { latitude: null },
            { longitude: null },
          ],
        },
        select: {
          id: true,
          fullName: true,
          street: true,
          number: true,
          neighborhood: true,
          zipCode: true,
        },
        take: limit,
      });

      console.log(`🌍 Iniciando geocodificação de ${patients.length} pacientes...`);

      let success = 0;
      let failed = 0;

      for (const patient of patients) {
        console.log(`\n📍 Processando: ${patient.fullName}`);
        
        const result = await this.geocodeAddress({
          street: patient.street,
          number: patient.number,
          neighborhood: patient.neighborhood,
          zipCode: patient.zipCode,
        });

        if (result) {
          await prisma.patients.update({
            where: { id: patient.id },
            data: {
              latitude: result.latitude,
              longitude: result.longitude,
              geocodedAt: new Date(),
            },
          });
          success++;
        } else {
          failed++;
        }

        // Aguardar 1 segundo entre requisições (política do Nominatim)
        await this.delay(this.delayBetweenRequests);
      }

      console.log(`\n✅ Geocodificação concluída:`);
      console.log(`   Total: ${patients.length}`);
      console.log(`   Sucesso: ${success}`);
      console.log(`   Falhas: ${failed}`);

      return {
        total: patients.length,
        success,
        failed,
      };
    } catch (error: any) {
      console.error('❌ Erro ao geocodificar pacientes:', error.message);
      throw error;
    }
  }

  /**
   * Geocodificar pacientes de uma microárea específica
   */
  async geocodeMicroArea(microAreaId: string, limit?: number): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    try {
      const patients = await prisma.patients.findMany({
        where: {
          microAreaId,
          deletedAt: null,
          OR: [
            { latitude: null },
            { longitude: null },
          ],
        },
        select: {
          id: true,
          fullName: true,
          street: true,
          number: true,
          neighborhood: true,
          zipCode: true,
        },
        take: limit,
      });

      console.log(`🌍 Iniciando geocodificação de ${patients.length} pacientes da microárea...`);

      let success = 0;
      let failed = 0;

      for (const patient of patients) {
        console.log(`\n📍 Processando: ${patient.fullName}`);
        
        const result = await this.geocodeAddress({
          street: patient.street,
          number: patient.number,
          neighborhood: patient.neighborhood,
          zipCode: patient.zipCode,
        });

        if (result) {
          await prisma.patients.update({
            where: { id: patient.id },
            data: {
              latitude: result.latitude,
              longitude: result.longitude,
              geocodedAt: new Date(),
            },
          });
          success++;
        } else {
          failed++;
        }

        // Aguardar 1 segundo entre requisições
        await this.delay(this.delayBetweenRequests);
      }

      console.log(`\n✅ Geocodificação concluída:`);
      console.log(`   Total: ${patients.length}`);
      console.log(`   Sucesso: ${success}`);
      console.log(`   Falhas: ${failed}`);

      return {
        total: patients.length,
        success,
        failed,
      };
    } catch (error: any) {
      console.error('❌ Erro ao geocodificar microárea:', error.message);
      throw error;
    }
  }

  /**
   * Obter estatísticas de geocodificação
   */
  async getGeocodingStats(microAreaId?: string) {
    const where = {
      deletedAt: null,
      ...(microAreaId ? { microAreaId } : {}),
    };

    const total = await prisma.patients.count({
      where,
    });

    const geocoded = await prisma.patients.count({
      where: {
        ...where,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const pending = total - geocoded;
    const percentage = total > 0 ? Math.round((geocoded / total) * 100) : 0;

    return {
      total,
      geocoded,
      pending,
      percentage,
    };
  }

  /**
   * Resetar geocodificação (limpa latitude/longitude/geocodedAt)
   */
  async resetGeocoding(microAreaId?: string): Promise<{ resetCount: number }> {
    const where = {
      deletedAt: null,
      ...(microAreaId ? { microAreaId } : {}),
    };

    const result = await prisma.patients.updateMany({
      where,
      data: {
        latitude: null,
        longitude: null,
        geocodedAt: null,
      },
    });

    return { resetCount: result.count };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new GeocodingService();
