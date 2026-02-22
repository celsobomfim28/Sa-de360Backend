import { prisma } from '../config/database';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MicroAreaBoundary {
  microAreaId: string;
  coordinates: Coordinates[];
}

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  indicator?: string;
  status?: string;
}

interface RouteOptimization {
  visits: Array<{
    patientId: string;
    patientName: string;
    address: string;
    latitude: number;
    longitude: number;
    priority: number;
  }>;
  optimizedOrder: number[];
  totalDistance: number;
  estimatedTime: number;
}

export class TerritorizationService {
  // Obter limites de microárea
  async getMicroAreaBoundaries(microAreaId: string): Promise<MicroAreaBoundary | null> {
    const microArea = await prisma.micro_areas.findUnique({
      where: { id: microAreaId },
      include: {
        patients: {
          where: {
            deletedAt: null,
            latitude: { not: null },
            longitude: { not: null },
          },
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!microArea || microArea.patients.length === 0) {
      return null;
    }

    // Calcular envelope convexo (convex hull) dos pontos
    const coordinates = microArea.patients.map(p => ({
      latitude: p.latitude!,
      longitude: p.longitude!,
    }));

    return {
      microAreaId,
      coordinates: this.calculateConvexHull(coordinates),
    };
  }

  // Obter mapa de calor de indicadores
  async getIndicatorHeatmap(filters: {
    microAreaId?: string;
    indicator?: string;
    status?: 'GREEN' | 'YELLOW' | 'RED';
  }): Promise<Array<{
    patientId: string;
    patientName: string;
    latitude: number;
    longitude: number;
    intensity: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
    criticalCount: number;
    microArea: string;
  }>> {
    const where: any = {
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (filters.microAreaId) {
      where.microAreaId = filters.microAreaId;
    }

    // Buscar pacientes com indicadores críticos
    const patients = await prisma.patients.findMany({
      where,
      include: {
        micro_areas: true,
        prenatal_data: {
          include: { prenatal_indicators: true },
        },
        childcare_indicators: true,
        diabetes_indicators: true,
        hypertension_indicators: true,
        elderly_indicators: true,
        woman_health_indicators: true,
      },
    });

    const heatmapPoints: Array<{
      patientId: string;
      patientName: string;
      latitude: number;
      longitude: number;
      intensity: number;
      status: 'GREEN' | 'YELLOW' | 'RED';
      criticalCount: number;
      microArea: string;
    }> = [];

    for (const patient of patients) {
      const indicators = this.getPatientIndicators(patient);
      
      // Filtrar por indicador específico se solicitado
      let relevantIndicators = indicators;
      if (filters.indicator) {
        relevantIndicators = indicators.filter(i => i.code === filters.indicator);
      }

      // Filtrar por status se solicitado
      if (filters.status) {
        relevantIndicators = relevantIndicators.filter(i => i.status === filters.status);
      }

      // Calcular intensidade baseada no número de indicadores críticos
      const criticalCount = relevantIndicators.filter(i => i.status === 'RED').length;
      const warningCount = relevantIndicators.filter(i => i.status === 'YELLOW').length;
      
      const intensity = (criticalCount * 3) + (warningCount * 1);

      // Determinar status geral do paciente
      let overallStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      if (criticalCount > 0) overallStatus = 'RED';
      else if (warningCount > 0) overallStatus = 'YELLOW';

      if (intensity > 0 || !filters.status) {
        heatmapPoints.push({
          patientId: patient.id,
          patientName: patient.fullName,
          latitude: patient.latitude!,
          longitude: patient.longitude!,
          intensity,
          status: overallStatus,
          criticalCount,
          microArea: patient.micro_areas?.name || 'Sem microárea',
        });
      }
    }

    return heatmapPoints;
  }

  // Identificar áreas de risco
  async getRiskAreas(microAreaId?: string): Promise<Array<{
    center: Coordinates;
    radius: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    patientCount: number;
    criticalIndicators: number;
  }>> {
    const heatmapPoints = await this.getIndicatorHeatmap({ 
      microAreaId,
      status: 'RED',
    });

    // Agrupar pontos próximos usando clustering simples
    const clusters = this.clusterPoints(heatmapPoints, 0.01); // ~1km de raio

    return clusters.map(cluster => {
      const avgLat = cluster.reduce((sum, p) => sum + p.latitude, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, p) => sum + p.longitude, 0) / cluster.length;
      const totalIntensity = cluster.reduce((sum, p) => sum + p.intensity, 0);

      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (totalIntensity >= 20) riskLevel = 'HIGH';
      else if (totalIntensity >= 10) riskLevel = 'MEDIUM';

      return {
        center: { latitude: avgLat, longitude: avgLng },
        radius: 1000, // 1km
        riskLevel,
        patientCount: cluster.length,
        criticalIndicators: totalIntensity,
      };
    }).sort((a, b) => b.criticalIndicators - a.criticalIndicators);
  }

  // Otimizar rota de visitas
  async optimizeVisitRoute(
    acsId: string,
    date: Date
  ): Promise<RouteOptimization> {
    // Buscar pacientes que precisam de visita
    const patients = await prisma.patients.findMany({
      where: {
        deletedAt: null,
        micro_areas: {
          users: {
            some: { id: acsId },
          },
        },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        prenatal_data: {
          include: { prenatal_indicators: true },
        },
        childcare_indicators: true,
        diabetes_indicators: true,
        hypertension_indicators: true,
        elderly_indicators: true,
      },
    });

    // Filtrar pacientes que precisam de visita
    const visitsNeeded = patients
      .filter(p => this.needsVisit(p))
      .map(p => ({
        patientId: p.id,
        patientName: p.fullName,
        address: `${p.street || ''}, ${p.number || ''} - ${p.neighborhood || ''}`.trim() || 'Endereço não cadastrado',
        latitude: p.latitude!,
        longitude: p.longitude!,
        priority: this.calculateVisitPriority(p),
      }))
      .sort((a, b) => b.priority - a.priority);

    if (visitsNeeded.length === 0) {
      return {
        visits: [],
        optimizedOrder: [],
        totalDistance: 0,
        estimatedTime: 0,
      };
    }

    // Algoritmo de otimização de rota (Nearest Neighbor)
    const optimizedOrder = this.nearestNeighborRoute(visitsNeeded);
    const totalDistance = this.calculateTotalDistance(visitsNeeded, optimizedOrder);
    const estimatedTime = Math.ceil(totalDistance / 4 * 60); // 4 km/h, resultado em minutos

    return {
      visits: visitsNeeded,
      optimizedOrder,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedTime,
    };
  }

  // Estatísticas de cobertura territorial
  async getTerritorialCoverage(microAreaId?: string) {
    const where: any = { deletedAt: null };
    if (microAreaId) {
      where.microAreaId = microAreaId;
    }

    const totalPatients = await prisma.patients.count({ where });
    
    const patientsWithLocation = await prisma.patients.count({
      where: {
        ...where,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const recentVisits = await prisma.home_visits.count({
      where: {
        patients: where,
        visitDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
        },
      },
    });

    const coveragePercentage = totalPatients > 0 
      ? Math.round((patientsWithLocation / totalPatients) * 100)
      : 0;

    const visitCoveragePercentage = totalPatients > 0
      ? Math.round((recentVisits / totalPatients) * 100)
      : 0;

    return {
      totalPatients,
      patientsWithLocation,
      coveragePercentage,
      recentVisits,
      visitCoveragePercentage,
      patientsWithoutLocation: totalPatients - patientsWithLocation,
    };
  }

  // Métodos auxiliares privados

  private calculateConvexHull(points: Coordinates[]): Coordinates[] {
    if (points.length < 3) return points;

    // Implementação simples de Graham Scan
    const sorted = [...points].sort((a, b) => 
      a.latitude === b.latitude ? a.longitude - b.longitude : a.latitude - b.latitude
    );

    const cross = (o: Coordinates, a: Coordinates, b: Coordinates) => {
      return (a.latitude - o.latitude) * (b.longitude - o.longitude) -
             (a.longitude - o.longitude) * (b.latitude - o.latitude);
    };

    const lower: Coordinates[] = [];
    for (const point of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    }

    const upper: Coordinates[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const point = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  private clusterPoints(points: HeatmapPoint[], threshold: number): HeatmapPoint[][] {
    const clusters: HeatmapPoint[][] = [];
    const visited = new Set<number>();

    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;

      const cluster: HeatmapPoint[] = [points[i]];
      visited.add(i);

      for (let j = i + 1; j < points.length; j++) {
        if (visited.has(j)) continue;

        const distance = this.calculateDistance(
          points[i].latitude,
          points[i].longitude,
          points[j].latitude,
          points[j].longitude
        );

        if (distance <= threshold) {
          cluster.push(points[j]);
          visited.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private nearestNeighborRoute(visits: any[]): number[] {
    if (visits.length === 0) return [];
    
    const route: number[] = [0]; // Começar do primeiro paciente
    const visited = new Set<number>([0]);

    while (route.length < visits.length) {
      const current = visits[route[route.length - 1]];
      let nearest = -1;
      let minDistance = Infinity;

      for (let i = 0; i < visits.length; i++) {
        if (visited.has(i)) continue;

        const distance = this.calculateDistance(
          current.latitude,
          current.longitude,
          visits[i].latitude,
          visits[i].longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      }

      if (nearest !== -1) {
        route.push(nearest);
        visited.add(nearest);
      } else {
        break;
      }
    }

    return route;
  }

  private calculateTotalDistance(visits: any[], order: number[]): number {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) {
      const from = visits[order[i]];
      const to = visits[order[i + 1]];
      total += this.calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
    }
    return total;
  }

  private getPatientIndicators(patient: any): Array<{ code: string; status: string }> {
    const indicators: Array<{ code: string; status: string }> = [];

    if (patient.prenatal_data?.prenatal_indicators) {
      const ind = patient.prenatal_data.prenatal_indicators;
      indicators.push(
        { code: 'C1', status: ind.c1Status },
        { code: 'C2', status: ind.c2Status },
        { code: 'C3', status: ind.c3Status },
        { code: 'C4', status: ind.c4Status },
        { code: 'C5', status: ind.c5Status },
        { code: 'C6', status: ind.c6Status }
      );
    }

    if (patient.childcare_indicators) {
      const ind = patient.childcare_indicators;
      indicators.push(
        { code: 'B1', status: ind.b1Status },
        { code: 'B2', status: ind.b2Status },
        { code: 'B3', status: ind.b3Status },
        { code: 'B4', status: ind.b4Status },
        { code: 'B5', status: ind.b5Status }
      );
    }

    if (patient.diabetes_indicators) {
      const ind = patient.diabetes_indicators;
      indicators.push(
        { code: 'D1', status: ind.d1Status },
        { code: 'D2', status: ind.d2Status },
        { code: 'D3', status: ind.d3Status },
        { code: 'D4', status: ind.d4Status },
        { code: 'D5', status: ind.d5Status },
        { code: 'D6', status: ind.d6Status }
      );
    }

    if (patient.hypertension_indicators) {
      const ind = patient.hypertension_indicators;
      indicators.push(
        { code: 'E1', status: ind.e1Status },
        { code: 'E2', status: ind.e2Status },
        { code: 'E3', status: ind.e3Status },
        { code: 'E4', status: ind.e4Status }
      );
    }

    if (patient.elderly_indicators) {
      const ind = patient.elderly_indicators;
      indicators.push(
        { code: 'F1', status: ind.f1Status },
        { code: 'F2', status: ind.f2Status }
      );
    }

    return indicators;
  }

  private needsVisit(patient: any): boolean {
    const indicators = this.getPatientIndicators(patient);
    
    // Precisa de visita se tiver indicadores C4, B4, D4 ou E4 em RED
    return indicators.some(i => 
      ['C4', 'B4', 'D4', 'E4'].includes(i.code) && i.status === 'RED'
    );
  }

  private calculateVisitPriority(patient: any): number {
    const indicators = this.getPatientIndicators(patient);
    
    let priority = 0;
    
    // Indicadores críticos (RED) = +3 pontos
    priority += indicators.filter(i => i.status === 'RED').length * 3;
    
    // Indicadores de atenção (YELLOW) = +1 ponto
    priority += indicators.filter(i => i.status === 'YELLOW').length * 1;
    
    // Gestantes e RN têm prioridade extra
    if (patient.isPregnant) priority += 5;
    if (patient.isChild) priority += 5;
    
    return priority;
  }
}

export default new TerritorizationService();






