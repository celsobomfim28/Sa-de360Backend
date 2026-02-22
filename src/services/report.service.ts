import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import PDFDocument from 'pdfkit';

const prismaAny = prisma as any;

export class ReportService {
    async generateReportPdf(
        reportId: string,
        user: { id: string; role: string; microAreaId?: string | null },
        query: Record<string, any>
    ): Promise<Buffer> {
        const roleMap: Record<string, string[]> = {
            'micro-area': ['ACS'],
            'home-visits': ['ACS'],
            'active-search': ['ACS'],
            procedures: ['TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'ADMIN'],
            'pending-exams': ['TECNICO_ENFERMAGEM', 'MEDICO', 'ENFERMEIRO', 'ADMIN'],
            'team-production': ['ENFERMEIRO', 'ADMIN'],
            'chronic-patients': ['MEDICO', 'ENFERMEIRO', 'ADMIN'],
            'childcare-indicators': ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
            'prenatal-indicators': ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
            'diabetes-indicators': ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
            'hypertension-indicators': ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
            'elderly-indicators': ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
            'woman-health-indicators': ['ACS', 'ENFERMEIRO', 'MEDICO', 'ADMIN'],
        };

        const allowedRoles = roleMap[reportId];
        if (!allowedRoles) {
            throw new AppError(404, 'Relatório não encontrado', 'REPORT_NOT_FOUND');
        }

        if (!allowedRoles.includes(user.role)) {
            throw new AppError(403, 'Sem permissão para este relatório', 'FORBIDDEN');
        }

        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        const microAreaId = (query.microAreaId as string | undefined) || user.microAreaId || undefined;
        const professionalId = query.professionalId as string | undefined;
        const headerContext = await this.getReportHeaderContext(user.id, microAreaId);

        let data: any;
        switch (reportId) {
            case 'micro-area':
                data = await this.getMicroAreaReport(user.id);
                break;
            case 'home-visits':
                data = await this.getHomeVisitsReport(user.id, startDate, endDate);
                break;
            case 'active-search':
                if (!microAreaId) {
                    throw new AppError(400, 'microAreaId é obrigatório para este relatório', 'VALIDATION_ERROR');
                }
                data = await this.getActiveSearchReport(microAreaId);
                break;
            case 'procedures':
                data = await this.getProceduresReport(professionalId, startDate, endDate);
                break;
            case 'pending-exams':
                data = await this.getPendingExamsReport();
                break;
            case 'team-production':
                if (!startDate || !endDate) {
                    throw new AppError(400, 'startDate e endDate são obrigatórios', 'VALIDATION_ERROR');
                }
                data = await this.getTeamProductionReport(startDate, endDate, microAreaId);
                break;
            case 'chronic-patients':
                data = await this.getChronicPatientsReport(microAreaId);
                break;
            case 'childcare-indicators':
                data = await this.getChildcareIndicatorsReport(microAreaId);
                break;
            case 'prenatal-indicators':
                data = await this.getPrenatalIndicatorsReport(microAreaId);
                break;
            case 'diabetes-indicators':
                data = await this.getDiabetesIndicatorsReport(microAreaId);
                break;
            case 'hypertension-indicators':
                data = await this.getHypertensionIndicatorsReport(microAreaId);
                break;
            case 'elderly-indicators':
                data = await this.getElderlyIndicatorsReport(microAreaId);
                break;
            case 'woman-health-indicators':
                data = await this.getWomanHealthIndicatorsReport(microAreaId);
                break;
            default:
                throw new AppError(404, 'Relatório não encontrado', 'REPORT_NOT_FOUND');
        }

        if (reportId === 'micro-area') {
            return await this.renderMicroAreaPdf(data, headerContext);
        }

        if (reportId === 'home-visits') {
            return await this.renderHomeVisitsPdf(data, headerContext);
        }

        if (reportId === 'active-search') {
            return await this.renderActiveSearchPdf(data, headerContext);
        }

        const indicatorTitles: Record<string, string> = {
            'childcare-indicators': 'Puericultura',
            'prenatal-indicators': 'Gestante',
            'diabetes-indicators': 'Diabetes',
            'hypertension-indicators': 'Hipertensão',
            'elderly-indicators': 'Idosos',
            'woman-health-indicators': 'Saúde da Mulher',
        };

        if (indicatorTitles[reportId]) {
            return await this.renderIndicatorsPdf(data, indicatorTitles[reportId], headerContext);
        }

        return await this.renderJsonAsPdf(`Relatório: ${reportId}`, data, headerContext);
    }

    private async renderMicroAreaPdf(data: any, headerContext: { acs: string; cpf: string; microArea: string }): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];
            const printableWidth = 515;

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const generatedAt = new Date().toLocaleString('pt-BR');

            doc.font('Helvetica-Bold').fontSize(16).text('Saúde 360 PSF', { align: 'left' });
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(12).text('Relatório: Microárea');
            doc.moveDown(0.2);
            doc.fontSize(10).text(`Gerado em: ${generatedAt}`);
            doc.moveDown();

            doc.font('Helvetica-Bold').fontSize(12).text('Resumo', { width: printableWidth });
            doc.moveDown(0.4);

            doc.font('Helvetica').fontSize(10);
            doc.text(`• Acs: ${headerContext.acs}`, { width: printableWidth });
            doc.text(`• Cpf: ${headerContext.cpf}`, { width: printableWidth });
            doc.text(`• Micro Area: ${headerContext.microArea}`, { width: printableWidth });
            doc.text(`• Total Pacientes: ${this.normalizeCellValue(data?.totalPatients)}`, {
                width: printableWidth,
            });

            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(12).text('Pacientes', { width: printableWidth });
            doc.moveDown(0.4);

            const rows = (data?.families || []).flatMap((family: any) =>
                (family.members || []).map((member: any, index: number) => ({
                    familyAddress: family.address,
                    isFirstMember: index === 0,
                    name: member.name,
                    cns: member.cns,
                    birthDate: member.birthDate,
                }))
            );

            const tableCols = {
                no: 5,
                name: 33,
                cns: 18,
                birthDate: 18,
            };

            const line =
                `|${this.padCell('Nº', tableCols.no)}|` +
                `${this.padCell('Nome', tableCols.name)}|` +
                `${this.padCell('CNS', tableCols.cns)}|` +
                `${this.padCell('Data de Nascimento', tableCols.birthDate)}|`;

            doc.font('Courier-Bold').fontSize(9).text(line, { width: printableWidth });
            doc.font('Courier').text('-'.repeat(line.length), { width: printableWidth });

            rows.forEach((row: any, idx: number) => {
                this.ensurePageSpace(doc, 14);
                const rowLine =
                    `|${this.padCell(String(idx + 1).padStart(2, '0'), tableCols.no)}|` +
                    `${this.padCell(this.normalizeCellValue(row.name), tableCols.name)}|` +
                    `${this.padCell(this.normalizeCellValue(row.cns), tableCols.cns)}|` +
                    `${this.padCell(this.formatDate(row.birthDate), tableCols.birthDate)}|`;

                doc.font('Courier').fontSize(9).text(rowLine, { width: printableWidth });
            });

            if (rows.length === 0) {
                doc.moveDown(0.2);
                doc.font('Helvetica').fontSize(10).text('Nenhum paciente encontrado para esta microárea.');
            }

            doc.end();
        });
    }

    private async renderHomeVisitsPdf(
        data: any,
        headerContext: { acs: string; cpf: string; microArea: string }
    ): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];
            const printableWidth = 515;

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.font('Helvetica-Bold').fontSize(16).text('Saúde 360 PSF', { align: 'left' });
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(12).text('Relatório: Visita Domiciliar');
            doc.moveDown(0.2);
            doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
            doc.moveDown();

            doc.font('Helvetica-Bold').fontSize(12).text('Resumo', { width: printableWidth });
            doc.moveDown(0.4);
            doc.font('Helvetica').fontSize(10);
            doc.text(`• Acs: ${headerContext.acs}`, { width: printableWidth });
            doc.text(`• Cpf: ${headerContext.cpf}`, { width: printableWidth });
            doc.text(`• Micro Area: ${headerContext.microArea}`, { width: printableWidth });
            doc.text(`• Total de Visitas: ${this.normalizeCellValue(data?.totalVisits || 0)}`, { width: printableWidth });

            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(12).text('Histórico de Visitas', { width: printableWidth });
            doc.moveDown(0.4);

            const tableCols = { date: 12, patient: 29, type: 16, purpose: 31 };
            const headerLine =
                `|${this.padCell('Data da Visita', tableCols.date)}|` +
                `${this.padCell('Paciente', tableCols.patient)}|` +
                `${this.padCell('Tipo', tableCols.type)}|` +
                `${this.padCell('Finalidade', tableCols.purpose)}|`;

            doc.font('Courier-Bold').fontSize(9).text(headerLine, { width: printableWidth });
            doc.font('Courier').fontSize(9).text('-'.repeat(headerLine.length), { width: printableWidth });

            (data?.visits || []).forEach((visit: any) => {
                this.ensurePageSpace(doc, 14);
                const rowLine =
                    `|${this.padCell(this.formatDate(visit.date), tableCols.date)}|` +
                    `${this.padCell(this.normalizeCellValue(visit.patient), tableCols.patient)}|` +
                    `${this.padCell(this.normalizeCellValue(visit.type), tableCols.type)}|` +
                    `${this.padCell(this.normalizeCellValue(visit.purpose), tableCols.purpose)}|`;
                doc.font('Courier').fontSize(9).text(rowLine, { width: printableWidth });
            });

            doc.end();
        });
    }

    private async renderActiveSearchPdf(
        data: any,
        headerContext: { acs: string; cpf: string; microArea: string }
    ): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];
            const printableWidth = 515;

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.font('Helvetica-Bold').fontSize(16).text('Saúde 360 PSF', { align: 'left' });
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(12).text('Relatório: Busca Ativa');
            doc.moveDown(0.2);
            doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
            doc.moveDown();

            doc.font('Helvetica-Bold').fontSize(12).text('Resumo', { width: printableWidth });
            doc.moveDown(0.4);
            doc.font('Helvetica').fontSize(10);
            doc.text(`• Acs: ${headerContext.acs}`, { width: printableWidth });
            doc.text(`• Cpf: ${headerContext.cpf}`, { width: printableWidth });
            doc.text(`• Micro Area: ${headerContext.microArea}`, { width: printableWidth });
            doc.text(`• Total Pacientes com Pendencias: ${this.normalizeCellValue(data?.totalPatients || 0)}`, {
                width: printableWidth,
            });

            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(12).text('Pacientes', { width: printableWidth });
            doc.moveDown(0.4);

            const tableCols = { no: 5, name: 33, pendencias: 72 };
            const headerLine =
                `|${this.padCell('Nº', tableCols.no)}|` +
                `${this.padCell('Nome', tableCols.name)}|` +
                `${this.padCell('Pendencias', tableCols.pendencias)}|`;

            doc.font('Courier-Bold').fontSize(9).text(headerLine, { width: printableWidth });
            doc.font('Courier').fontSize(9).text('-'.repeat(headerLine.length), { width: printableWidth });

            (data?.patients || []).forEach((patient: any, idx: number) => {
                this.ensurePageSpace(doc, 14);
                const pendencias = Array.isArray(patient.pendencies) ? patient.pendencies.join('; ') : '-';
                const rowLine =
                    `|${this.padCell(String(idx + 1).padStart(2, '0'), tableCols.no)}|` +
                    `${this.padCell(this.normalizeCellValue(patient.name), tableCols.name)}|` +
                    `${this.padCell(this.normalizeCellValue(pendencias), tableCols.pendencias)}|`;
                doc.font('Courier').fontSize(9).text(rowLine, { width: printableWidth });
            });

            doc.end();
        });
    }

    private async renderIndicatorsPdf(
        data: any,
        title: string,
        headerContext: { acs: string; cpf: string; microArea: string }
    ): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];
            const printableWidth = 515;

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.font('Helvetica-Bold').fontSize(16).text('Saúde 360 PSF', { align: 'left' });
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(12).text(`Relatório: ${title}`);
            doc.moveDown(0.2);
            doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
            doc.moveDown();

            const rows = this.extractPatientRowsFromData(data);

            doc.font('Helvetica-Bold').fontSize(12).text('Resumo', { width: printableWidth });
            doc.moveDown(0.4);
            doc.font('Helvetica').fontSize(10);
            doc.text(`• Acs: ${headerContext.acs}`, { width: printableWidth });
            doc.text(`• Cpf: ${headerContext.cpf}`, { width: printableWidth });
            doc.text(`• Micro Area: ${headerContext.microArea}`, { width: printableWidth });
            doc.text(`• Total Pacientes: ${rows.length}`, { width: printableWidth });

            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(12).text('Pacientes', { width: printableWidth });
            doc.moveDown(0.4);

            const tableCols = { no: 5, name: 33, cns: 18, birthDate: 18 };
            const headerLine =
                `|${this.padCell('Nº', tableCols.no)}|` +
                `${this.padCell('Nome', tableCols.name)}|` +
                `${this.padCell('CNS', tableCols.cns)}|` +
                `${this.padCell('Data de Nascimento', tableCols.birthDate)}|`;

            doc.font('Courier-Bold').fontSize(9).text(headerLine, { width: printableWidth });
            doc.font('Courier').fontSize(9).text('-'.repeat(headerLine.length), { width: printableWidth });

            rows.forEach((row, idx) => {
                this.ensurePageSpace(doc, 14);
                const rowLine =
                    `|${this.padCell(String(idx + 1).padStart(2, '0'), tableCols.no)}|` +
                    `${this.padCell(this.normalizeCellValue(row.name), tableCols.name)}|` +
                    `${this.padCell(this.normalizeCellValue(row.cns), tableCols.cns)}|` +
                    `${this.padCell(this.formatDate(row.birthDate), tableCols.birthDate)}|`;

                doc.font('Courier').fontSize(9).text(rowLine, { width: printableWidth });
            });

            doc.end();
        });
    }

    private async renderJsonAsPdf(title: string, data: any, headerContext?: { acs: string; cpf: string; microArea: string }): Promise<Buffer> {
        return await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];
            const printableWidth = 515;

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.font('Helvetica-Bold').fontSize(16).text('Saúde 360 PSF', { align: 'left' });
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(12).text(title);
            doc.moveDown(0.2);
            doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
            doc.moveDown();

            const rows = this.extractPatientRowsFromData(data);

            doc.font('Helvetica-Bold').fontSize(12).text('Resumo', { width: printableWidth });
            doc.moveDown(0.4);
            if (headerContext) {
                doc.font('Helvetica').fontSize(10).text(`• Acs: ${headerContext.acs}`, { width: printableWidth });
                doc.text(`• Cpf: ${headerContext.cpf}`, { width: printableWidth });
                doc.text(`• Micro Area: ${headerContext.microArea}`, { width: printableWidth });
            }
            doc.font('Helvetica').fontSize(10).text(`• Total Pacientes: ${rows.length}`, { width: printableWidth });

            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(12).text('Famílias', { width: printableWidth });
            doc.moveDown(0.4);

            const tableCols = {
                no: 5,
                name: 33,
                cns: 18,
                birthDate: 18,
            };

            const headerLine =
                `|${this.padCell('Nº', tableCols.no)}|` +
                `${this.padCell('Nome', tableCols.name)}|` +
                `${this.padCell('CNS', tableCols.cns)}|` +
                `${this.padCell('Data de Nascimento', tableCols.birthDate)}|`;

            doc.font('Courier-Bold').fontSize(9).text(headerLine, { width: printableWidth });
            doc.font('Courier').text('-'.repeat(headerLine.length), { width: printableWidth });

            rows.forEach((row, idx) => {
                this.ensurePageSpace(doc, 14);
                const rowLine =
                    `|${this.padCell(String(idx + 1).padStart(2, '0'), tableCols.no)}|` +
                    `${this.padCell(this.normalizeCellValue(row.name), tableCols.name)}|` +
                    `${this.padCell(this.normalizeCellValue(row.cns), tableCols.cns)}|` +
                    `${this.padCell(this.formatDate(row.birthDate), tableCols.birthDate)}|`;

                doc.font('Courier').fontSize(9).text(rowLine, { width: printableWidth });
            });

            if (rows.length === 0) {
                doc.moveDown(0.2);
                doc.font('Helvetica').fontSize(10).text('Nenhum paciente encontrado para este relatório.');
            }

            doc.end();
        });
    }

    private extractPatientRowsFromData(data: any): Array<{ name: unknown; cns: unknown; birthDate: unknown }> {
        const rows: Array<{ name: unknown; cns: unknown; birthDate: unknown }> = [];

        const walk = (value: unknown) => {
            if (!value) return;

            if (Array.isArray(value)) {
                value.forEach((item) => walk(item));
                return;
            }

            if (typeof value !== 'object') return;

            const record = value as Record<string, unknown>;

            const name = record.name ?? record.fullName ?? record.patient;
            const cns = record.cns;
            const birthDate = record.birthDate;

            if (name) {
                rows.push({ name, cns, birthDate });
            }

            Object.values(record).forEach((nested) => {
                if (nested && typeof nested === 'object') {
                    walk(nested);
                }
            });
        };

        walk(data);

        const dedup = new Map<string, { name: unknown; cns: unknown; birthDate: unknown }>();
        rows.forEach((row) => {
            const key = `${this.normalizeCellValue(row.name)}|${this.normalizeCellValue(row.cns)}|${this.formatDate(row.birthDate)}`;
            if (!dedup.has(key)) {
                dedup.set(key, row);
            }
        });

        return Array.from(dedup.values());
    }

    private ensurePageSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
        if (doc.y + requiredHeight > doc.page.height - 40) {
            doc.addPage();
        }
    }

    private normalizeCellValue(value: unknown): string {
        if (value === null || value === undefined) return '-';
        if (value instanceof Date) return value.toLocaleDateString('pt-BR');
        if (Array.isArray(value)) {
            return value.length ? value.map(v => this.normalizeCellValue(v)).join(', ') : '-';
        }
        if (typeof value === 'object') {
            const objectEntries = Object.entries(value as Record<string, unknown>);
            if (objectEntries.length === 0) return '-';
            return objectEntries
                .map(([k, v]) => `${k}: ${this.normalizeCellValue(v)}`)
                .join(' | ');
        }
        return String(value);
    }

    private fitCellText(text: string, width: number): string {
        const safe = text.replace(/\s+/g, ' ').trim();
        if (safe.length <= width) return safe.padEnd(width, ' ');
        if (width <= 3) return safe.slice(0, width);
        return `${safe.slice(0, width - 3)}...`;
    }

    private padCell(text: string, width: number): string {
        const safe = text.replace(/\s+/g, ' ').trim();
        if (safe.length <= width) return safe.padEnd(width, ' ');
        if (width <= 3) return safe.slice(0, width);
        return `${safe.slice(0, width - 3)}...`;
    }

    private formatDate(value: unknown): string {
        if (!value) return '-';
        const asDate = value instanceof Date ? value : new Date(value as string);
        if (Number.isNaN(asDate.getTime())) return '-';
        return asDate.toLocaleDateString('pt-BR');
    }

    private preparePdfSections(data: any): {
        summary: Array<{ label: string; value: string }>;
        tables: Array<{
            title: string;
            columns: Array<{ key: string; label: string }>;
            rows: Array<Record<string, unknown>>;
        }>;
    } {
        const summary: Array<{ label: string; value: string }> = [];
        const tables: Array<{
            title: string;
            columns: Array<{ key: string; label: string }>;
            rows: Array<Record<string, unknown>>;
        }> = [];

        if (Array.isArray(data)) {
            const rows = data.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
            if (rows.length > 0) {
                const columns = this.collectColumns(rows);
                tables.push({ title: 'Registros', columns, rows });
            }
            return { summary, tables };
        }

        if (!data || typeof data !== 'object') {
            summary.push({ label: 'Valor', value: this.normalizeCellValue(data) });
            return { summary, tables };
        }

        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                const rows = value.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
                if (rows.length > 0) {
                    const columns = this.collectColumns(rows);
                    tables.push({ title: this.toSectionTitle(key), columns, rows });
                } else {
                    summary.push({ label: this.toSectionTitle(key), value: this.normalizeCellValue(value) });
                }
                continue;
            }

            if (value && typeof value === 'object') {
                const nestedEntries = Object.entries(value as Record<string, unknown>);
                const hasOnlyPrimitiveValues = nestedEntries.every(([, nestedValue]) =>
                    !nestedValue || typeof nestedValue !== 'object' || nestedValue instanceof Date
                );

                if (hasOnlyPrimitiveValues) {
                    nestedEntries.forEach(([nestedKey, nestedValue]) => {
                        summary.push({
                            label: `${this.toSectionTitle(key)} - ${this.toSectionTitle(nestedKey)}`,
                            value: this.normalizeCellValue(nestedValue),
                        });
                    });
                } else {
                    summary.push({ label: this.toSectionTitle(key), value: this.normalizeCellValue(value) });
                }
                continue;
            }

            summary.push({ label: this.toSectionTitle(key), value: this.normalizeCellValue(value) });
        }

        return { summary, tables };
    }

    private collectColumns(rows: Array<Record<string, unknown>>): Array<{ key: string; label: string }> {
        const set = new Set<string>();
        rows.forEach((row) => {
            Object.keys(row).forEach((key) => set.add(key));
        });

        return Array.from(set).map((key) => ({
            key,
            label: this.toSectionTitle(key),
        }));
    }

    private toSectionTitle(text: string): string {
        return text
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .trim()
            .replace(/^./, (s) => s.toUpperCase());
    }

    private async getReportHeaderContext(
        userId: string,
        microAreaId?: string
    ): Promise<{ acs: string; cpf: string; microArea: string }> {
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { micro_areas: true },
        });

        if (!user) {
            return { acs: '-', cpf: '-', microArea: '-' };
        }

        let microAreaLabel = user.micro_areas?.code || user.micro_areas?.name || '-';

        if (!user.micro_areas && microAreaId) {
            const microArea = await prisma.micro_areas.findUnique({ where: { id: microAreaId } });
            microAreaLabel = microArea?.code || microArea?.name || '-';
        }

        return {
            acs: this.normalizeCellValue((user as any).fullName),
            cpf: this.normalizeCellValue((user as any).cpf),
            microArea: this.normalizeCellValue(microAreaLabel),
        };
    }

    /**
     * Relatório da Microárea (ACS)
     * Panorama completo de todas as famílias e pessoas sob responsabilidade
     */
    async getMicroAreaReport(acsId: string) {
        // Buscar ACS e sua microárea
        const acs = await prisma.users.findUnique({
            where: { id: acsId },
            include: {
                micro_areas: true,
            },
        });

        if (!acs || !acs.micro_areas) {
            throw new AppError(404, 'ACS ou microárea não encontrada', 'NOT_FOUND');
        }

        // Buscar todos os pacientes da microárea
        const patients = await prisma.patients.findMany({
            where: {
                microAreaId: acs.micro_areas.id,
                deletedAt: null,
            },
            include: {
                micro_areas: true,
            },
            orderBy: [
                { street: 'asc' },
                { number: 'asc' },
            ],
        });

        // Agrupar por endereço (família)
        const families = this.groupPatientsByAddress(patients);

        return {
            acs: {
                name: acs.fullName,
                cpf: acs.cpf,
            },
            microArea: {
                name: acs.micro_areas.name,
                code: acs.micro_areas.code,
            },
            totalFamilies: families.length,
            totalPatients: patients.length,
            families,
        };
    }

    /**
     * Relatório de Visitas Domiciliares Realizadas (ACS)
     */
    async getHomeVisitsReport(acsId: string, startDate?: Date, endDate?: Date) {
        const where: any = {
            acsId,
        };

        if (startDate || endDate) {
            where.visitDate = {};
            if (startDate) where.visitDate.gte = startDate;
            if (endDate) where.visitDate.lte = endDate;
        }

        const visits = await prisma.home_visits.findMany({
            where,
            include: {
                patients: {
                    select: {
                        fullName: true,
                        street: true,
                        number: true,
                    },
                },
            },
            orderBy: { visitDate: 'desc' },
        });

        return {
            totalVisits: visits.length,
            visits: visits.map(v => ({
                date: v.visitDate,
                patient: v.patients.fullName,
                address: `${v.patients.street}, ${v.patients.number}`,
                type: v.visitType,
                purpose: v.purpose,
                observations: v.observations,
                hasGeolocation: !!(v.latitude && v.longitude),
            })),
        };
    }

    /**
     * Relatório de Busca Ativa (ACS)
     * Lista de pacientes com pendências
     */
    async getActiveSearchReport(microAreaId: string) {
        const patients = await prisma.patients.findMany({
            where: {
                microAreaId,
                deletedAt: null,
            },
            include: {
                diabetes_indicators: true,
                hypertension_indicators: true,
                prenatal_data: {
                    include: {
                        prenatal_indicators: true,
                    },
                },
                childcare_indicators: true,
                elderly_indicators: true,
                woman_health_indicators: true,
                appointments: {
                    where: {
                        scheduledDate: {
                            gte: new Date(),
                            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // próximos 7 dias
                        },
                        status: {
                            in: ['SCHEDULED', 'CONFIRMED'],
                        },
                    },
                    orderBy: { scheduledDate: 'asc' },
                    take: 1,
                },
            },
        });

        const patientsWithPendencies = patients
            .map(p => {
                const pendencies: string[] = [];

                // Verificar consultas agendadas
                if (p.appointments.length > 0) {
                    const apt = p.appointments[0];
                    pendencies.push(`Consulta agendada para ${new Date(apt.scheduledDate).toLocaleDateString('pt-BR')}`);
                }

                // Verificar indicadores críticos
                if (p.diabetes_indicators) {
                    if (p.diabetes_indicators.d1Status === 'RED') pendencies.push('Consulta de diabetes pendente');
                    if (p.diabetes_indicators.d5Status === 'RED') pendencies.push('HbA1c em atraso');
                }

                if (p.hypertension_indicators) {
                    if (p.hypertension_indicators.e1Status === 'RED') pendencies.push('Consulta de hipertensão pendente');
                    if (p.hypertension_indicators.e2Status === 'RED') pendencies.push('Aferição de PA pendente');
                }

                if (p.childcare_indicators) {
                    if (p.childcare_indicators.b1Status === 'RED') pendencies.push('Primeira consulta de puericultura pendente');
                    if (p.childcare_indicators.b5Status === 'RED') pendencies.push('Vacinas atrasadas');
                }

                if (p.prenatal_data?.prenatal_indicators) {
                    if (p.prenatal_data.prenatal_indicators.c1Status === 'RED') pendencies.push('Primeira consulta de pré-natal pendente');
                }

                if (p.woman_health_indicators) {
                    if (p.woman_health_indicators.g1Status === 'RED') pendencies.push('Exame citopatológico pendente');
                }

                return {
                    id: p.id,
                    name: p.fullName,
                    address: `${p.street}, ${p.number}`,
                    phone: p.primaryPhone,
                    pendencies,
                };
            })
            .filter(p => p.pendencies.length > 0)
            .sort((a, b) => b.pendencies.length - a.pendencies.length); // Mais pendências primeiro

        return {
            totalPatients: patientsWithPendencies.length,
            patients: patientsWithPendencies,
        };
    }

    /**
     * Relatório de Procedimentos Realizados (Técnico de Enfermagem)
     * Inclui: Antropometria, Pressão Arterial e Vacinas
     */
    async getProceduresReport(professionalId?: string, startDate?: Date, endDate?: Date) {
        const whereConsultation: any = {};
        if (startDate || endDate) {
            whereConsultation.consultationDate = {};
            if (startDate) whereConsultation.consultationDate.gte = startDate;
            if (endDate) whereConsultation.consultationDate.lte = endDate;
        }
        if (professionalId) {
            whereConsultation.professionalId = professionalId;
        }

        const whereVaccine: any = {};
        if (startDate || endDate) {
            whereVaccine.applicationDate = {};
            if (startDate) whereVaccine.applicationDate.gte = startDate;
            if (endDate) whereVaccine.applicationDate.lte = endDate;
        }
        if (professionalId) {
            whereVaccine.appliedById = professionalId;
        }

        // Buscar consultas que incluem procedimentos e vacinas
        const [diabetesConsultations, hypertensionConsultations, childcareConsultations, prenatalConsultations, vaccineRecords] = await Promise.all([
            prisma.diabetes_consultations.findMany({
                where: whereConsultation,
                include: {
                    patients: { select: { fullName: true } },
                    users: { select: { fullName: true } },
                },
                orderBy: { consultationDate: 'desc' },
            }),
            prisma.hypertension_consultations.findMany({
                where: whereConsultation,
                include: {
                    patients: { select: { fullName: true } },
                    users: { select: { fullName: true } },
                },
                orderBy: { consultationDate: 'desc' },
            }),
            prisma.childcare_consultations.findMany({
                where: whereConsultation,
                include: {
                    patients: { select: { fullName: true } },
                    users: { select: { fullName: true } },
                },
                orderBy: { consultationDate: 'desc' },
            }),
            prisma.prenatal_consultations.findMany({
                where: whereConsultation,
                include: {
                    prenatal_data: {
                        include: {
                            patients: { select: { fullName: true } },
                        },
                    },
                    users: { select: { fullName: true } },
                },
                orderBy: { consultationDate: 'desc' },
            }),
            prisma.vaccine_records.findMany({
                where: whereVaccine,
                include: {
                    patients: { select: { fullName: true } },
                    users: { select: { fullName: true } },
                    vaccines: { select: { name: true } },
                },
                orderBy: { applicationDate: 'desc' },
            }),
        ]);

        const procedures: any[] = [];

        // Antropometria de consultas de diabetes
        diabetesConsultations.forEach((c: any) => {
            if (c.weight && c.height) {
                procedures.push({
                    date: c.consultationDate,
                    patient: c.patients.fullName,
                    type: 'Antropometria',
                    details: `Peso: ${c.weight}kg, Altura: ${c.height}cm, IMC: ${c.imc?.toFixed(1) || 'N/A'}`,
                    professional: c.users.fullName,
                });
            }
        });

        // Pressão arterial de consultas de hipertensão
        hypertensionConsultations.forEach((c: any) => {
            if (c.systolicBP && c.diastolicBP) {
                procedures.push({
                    date: c.consultationDate,
                    patient: c.patients.fullName,
                    type: 'Pressão Arterial',
                    details: `${c.systolicBP}/${c.diastolicBP} mmHg`,
                    professional: c.users.fullName,
                });
            }
        });

        // Antropometria de puericultura
        childcareConsultations.forEach((c: any) => {
            if (c.weight && c.height) {
                procedures.push({
                    date: c.consultationDate,
                    patient: c.patients.fullName,
                    type: 'Antropometria',
                    details: `Peso: ${c.weight}kg, Altura: ${c.height}cm, PC: ${c.headCircumference || 'N/A'}cm`,
                    professional: c.users.fullName,
                });
            }
        });

        // Antropometria de pré-natal
        prenatalConsultations.forEach((c: any) => {
            if (c.weight && c.height) {
                procedures.push({
                    date: c.consultationDate,
                    patient: c.prenatal_data.patients.fullName,
                    type: 'Antropometria',
                    details: `Peso: ${c.weight}kg, Altura: ${c.height}cm, IMC: ${c.imc?.toFixed(1) || 'N/A'}`,
                    professional: c.users.fullName,
                });
            }
        });

        // Vacinas aplicadas
        vaccineRecords.forEach((v: any) => {
            procedures.push({
                date: v.applicationDate,
                patient: v.patients.fullName,
                type: 'Vacina',
                details: `${v.vaccines.name} - ${v.dose}ª dose${v.batchNumber ? ` (Lote: ${v.batchNumber})` : ''}`,
                professional: v.users.fullName,
            });
        });

        const anthropometryCount = procedures.filter(p => p.type === 'Antropometria').length;
        const bloodPressureCount = procedures.filter(p => p.type === 'Pressão Arterial').length;
        const vaccinesCount = procedures.filter(p => p.type === 'Vacina').length;

        return {
            summary: {
                anthropometry: anthropometryCount,
                bloodPressure: bloodPressureCount,
                vaccines: vaccinesCount,
                total: procedures.length,
            },
            procedures: procedures.sort((a, b) => b.date.getTime() - a.date.getTime()),
        };
    }

    /**
     * Relatório de Exames Pendentes (Técnico/Médico)
     */
    async getPendingExamsReport() {
        // Buscar solicitações de exames pendentes
        const pendingRequests = await prismaAny.labExamRequest.findMany({
            where: {
                status: 'PENDING',
            },
            include: {
                patient: {
                    select: {
                        fullName: true,
                        primaryPhone: true,
                    },
                },
                exams: true,
            },
            orderBy: { requestDate: 'asc' },
        });

        // Buscar exames coletados aguardando resultado
        const collectedRequests = await prismaAny.labExamRequest.findMany({
            where: {
                status: {
                    in: ['COLLECTED', 'IN_ANALYSIS'],
                },
            },
            include: {
                patient: {
                    select: {
                        fullName: true,
                    },
                },
                exams: true,
            },
            orderBy: { requestDate: 'asc' },
        });

        // Buscar exames com resultado pendente de avaliação
        const pendingEvaluationRequests = await prismaAny.labExamRequest.findMany({
            where: {
                status: {
                    in: ['IN_ANALYSIS', 'COMPLETED'],
                },
            },
            include: {
                patient: {
                    select: {
                        fullName: true,
                    },
                },
                exams: {
                    where: {
                        evaluated: false,
                    },
                },
            },
            orderBy: { requestDate: 'asc' },
        });

        return {
            pendingCollection: pendingRequests.map((r: any) => ({
                patient: r.patient.fullName,
                phone: r.patient.primaryPhone,
                requestDate: r.requestDate,
                exams: (r.exams || []).map((e: any) => e.examType),
                priority: r.priority || 'NORMAL',
            })),
            collected: collectedRequests.map((r: any) => ({
                patient: r.patient.fullName,
                collectionDate: (r.exams || []).reduce((latest: Date | null, e: any) => {
                    if (!e.collectionDate) return latest;
                    if (!latest || e.collectionDate > latest) return e.collectionDate;
                    return latest;
                }, null),
                exams: (r.exams || []).map((e: any) => e.examType),
            })),
            pendingEvaluation: pendingEvaluationRequests
                .flatMap((r: any) =>
                    (r.exams || []).map((e: any) => ({
                        patient: r.patient.fullName,
                        examType: e.examType,
                        resultDate: e.resultDate,
                        interpretation: e.interpretation,
                    }))
                ),
        };
    }

    /**
     * Relatório de Produção da Equipe (Enfermeiro/Admin)
     */
    async getTeamProductionReport(startDate: Date, endDate: Date, microAreaId?: string) {
        const where: any = {};
        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        // Buscar profissionais
        const professionals = await prisma.users.findMany({
            where: {
                isActive: true,
                ...(microAreaId ? { microAreaId } : {}),
            },
            select: {
                id: true,
                fullName: true,
                role: true,
            },
        });

        const production = await Promise.all(
            professionals.map(async prof => {
                // Contar visitas domiciliares
                const visits = await prisma.home_visits.count({
                    where: {
                        acsId: prof.id,
                        visitDate: { gte: startDate, lte: endDate },
                    },
                });

                // Contar procedimentos de antropometria (de várias consultas)
                const [diabetesAnthro, hypertensionAnthro, childcareAnthro, prenatalAnthro] = await Promise.all([
                    prisma.diabetes_consultations.count({
                        where: {
                            professionalId: prof.id,
                            consultationDate: { gte: startDate, lte: endDate },
                            AND: [
                                { weight: { not: null } },
                                { height: { not: null } },
                            ],
                        },
                    }),
                    prisma.hypertension_consultations.count({
                        where: {
                            professionalId: prof.id,
                            consultationDate: { gte: startDate, lte: endDate },
                            AND: [
                                { weight: { not: null } },
                                { height: { not: null } },
                            ],
                        },
                    }),
                    prisma.childcare_consultations.count({
                        where: {
                            professionalId: prof.id,
                            consultationDate: { gte: startDate, lte: endDate },
                        },
                    }),
                    prisma.prenatal_consultations.count({
                        where: {
                            professionalId: prof.id,
                            consultationDate: { gte: startDate, lte: endDate },
                            height: { not: null },
                        },
                    }),
                ]);

                const anthropometry = diabetesAnthro + hypertensionAnthro + childcareAnthro + prenatalAnthro;

                // Contar aferições de pressão arterial
                const bloodPressure = await prisma.hypertension_consultations.count({
                    where: {
                        professionalId: prof.id,
                        consultationDate: { gte: startDate, lte: endDate },
                    },
                });

                // Contar vacinas aplicadas
                const vaccines = await prisma.vaccine_records.count({
                    where: {
                        appliedById: prof.id,
                        applicationDate: { gte: startDate, lte: endDate },
                    },
                });

                return {
                    professional: prof.fullName,
                    role: prof.role,
                    visits,
                    anthropometry,
                    bloodPressure,
                    vaccines,
                    total: visits + anthropometry + bloodPressure + vaccines,
                };
            })
        );

        return {
            period: {
                start: startDate,
                end: endDate,
            },
            production: production.sort((a, b) => b.total - a.total),
            totals: {
                visits: production.reduce((sum, p) => sum + p.visits, 0),
                anthropometry: production.reduce((sum, p) => sum + p.anthropometry, 0),
                bloodPressure: production.reduce((sum, p) => sum + p.bloodPressure, 0),
                vaccines: production.reduce((sum, p) => sum + p.vaccines, 0),
                total: production.reduce((sum, p) => sum + p.total, 0),
            },
        };
    }

    /**
     * Relatório de Pacientes Crônicos por Risco (Médico)
     */
    async getChronicPatientsReport(microAreaId?: string) {
        const where: any = {
            deletedAt: null,
            OR: [
                { hasDiabetes: true },
                { hasHypertension: true },
            ],
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const patients = await prisma.patients.findMany({
            where,
            include: {
                diabetes_indicators: true,
                hypertension_indicators: true,
                micro_areas: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        const patientsWithRisk = patients.map(p => {
            let riskScore = 0;
            const issues: string[] = [];

            // Calcular risco baseado em indicadores
            if (p.diabetes_indicators) {
                const d = p.diabetes_indicators;
                if (d.d1Status === 'RED') { riskScore += 3; issues.push('Consulta de diabetes atrasada'); }
                if (d.d5Status === 'RED') { riskScore += 3; issues.push('HbA1c em atraso'); }
                if (d.d6Status === 'RED') { riskScore += 2; issues.push('Exame dos pés pendente'); }
            }

            if (p.hypertension_indicators) {
                const h = p.hypertension_indicators;
                if (h.e1Status === 'RED') { riskScore += 3; issues.push('Consulta de hipertensão atrasada'); }
                if (h.e2Status === 'RED') { riskScore += 2; issues.push('PA não aferida'); }
            }

            const riskLevel = riskScore >= 6 ? 'ALTO' : riskScore >= 3 ? 'MÉDIO' : 'BAIXO';

            return {
                id: p.id,
                name: p.fullName,
                age: Math.floor((Date.now() - p.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                microArea: p.micro_areas.name,
                conditions: [
                    p.hasDiabetes ? 'Diabetes' : null,
                    p.hasHypertension ? 'Hipertensão' : null,
                ].filter(Boolean),
                riskLevel,
                riskScore,
                issues,
            };
        });

        return {
            total: patientsWithRisk.length,
            byRisk: {
                high: patientsWithRisk.filter(p => p.riskLevel === 'ALTO').length,
                medium: patientsWithRisk.filter(p => p.riskLevel === 'MÉDIO').length,
                low: patientsWithRisk.filter(p => p.riskLevel === 'BAIXO').length,
            },
            patients: patientsWithRisk.sort((a, b) => b.riskScore - a.riskScore),
        };
    }

    /**
     * Buscar microáreas para filtros
     */
    async getMicroAreas() {
        const microAreas = await prisma.micro_areas.findMany({
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: { name: 'asc' },
        });

        return microAreas;
    }

    /**
     * Buscar profissionais para filtros
     */
    async getProfessionals() {
        const professionals = await prisma.users.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                fullName: true,
                role: true,
            },
            orderBy: { fullName: 'asc' },
        });

        return professionals;
    }

    /**
     * Relatório de Indicadores de Puericultura (C2)
     * Cuidado no Desenvolvimento Infantil
     */
    async getChildcareIndicatorsReport(microAreaId?: string) {
        const where: any = {
            isChild: true,
            deletedAt: null,
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const children = await prisma.patients.findMany({
            where,
            include: {
                childcare_indicators: true,
                micro_areas: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { birthDate: 'desc' },
        });

        const childrenWithStatus = children.map(child => {
            const indicators = child.childcare_indicators;
            const ageMonths = Math.floor((Date.now() - child.birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

            return {
                id: child.id,
                name: child.fullName,
                birthDate: child.birthDate,
                ageMonths,
                microArea: child.micro_areas.name,
                indicators: {
                    b1: indicators?.b1Status || 'GRAY', // Primeira consulta
                    b2: indicators?.b2Status || 'GRAY', // Consultas realizadas
                    b3: indicators?.b3Status || 'GRAY', // Antropometria
                    b4: indicators?.b4Status || 'GRAY', // Visitas domiciliares
                    b5: indicators?.b5Status || 'GRAY', // Vacinas
                },
                counts: {
                    consultations: indicators?.consultationCount || 0,
                    anthropometry: indicators?.anthropometryCount || 0,
                },
                lastUpdate: indicators?.lastUpdated,
            };
        });

        const summary = {
            total: childrenWithStatus.length,
            byStatus: {
                green: childrenWithStatus.filter(c => 
                    Object.values(c.indicators).every(s => s === 'GREEN')
                ).length,
                yellow: childrenWithStatus.filter(c => 
                    Object.values(c.indicators).some(s => s === 'YELLOW') &&
                    !Object.values(c.indicators).some(s => s === 'RED')
                ).length,
                red: childrenWithStatus.filter(c => 
                    Object.values(c.indicators).some(s => s === 'RED')
                ).length,
            },
        };

        return {
            summary,
            children: childrenWithStatus,
        };
    }

    /**
     * Relatório de Indicadores de Pré-Natal e Puerpério (C3)
     */
    async getPrenatalIndicatorsReport(microAreaId?: string) {
        const where: any = {
            isPregnant: true,
            deletedAt: null,
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const pregnantWomen = await prisma.patients.findMany({
            where,
            include: {
                prenatal_data: {
                    include: {
                        prenatal_indicators: true,
                    },
                },
                micro_areas: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { fullName: 'asc' },
        });

        const pregnantWithStatus = pregnantWomen.map(woman => {
            const prenatal = woman.prenatal_data;
            const indicators = prenatal?.prenatal_indicators;

            return {
                id: woman.id,
                name: woman.fullName,
                microArea: woman.micro_areas.name,
                gestationalWeek: prenatal?.gestationalAge || 0,
                dueDate: prenatal?.expectedDeliveryDate,
                indicators: {
                    c1: indicators?.c1Status || 'GRAY', // Primeira consulta até 12 semanas
                    c2: indicators?.c2Status || 'GRAY', // 7 consultas
                    c3: indicators?.c3Status || 'GRAY', // 7 aferições de PA
                    c4: indicators?.c4Status || 'GRAY', // 7 registros peso/altura
                    c5: indicators?.c5Status || 'GRAY', // 3 visitas ACS
                    c6: indicators?.c6Status || 'GRAY', // Vacina dTpa
                    c7: indicators ? (indicators.exams1stTriCompleted ? 'GREEN' : 'RED') : 'GRAY', // Exames 1º trimestre
                    c8: indicators ? (indicators.exams3rdTriCompleted ? 'GREEN' : 'RED') : 'GRAY', // Exames 3º trimestre
                },
                counts: {
                    consultations: indicators?.prenatalConsultationCount || 0,
                    homeVisits: indicators
                        ? [indicators.vd1Date, indicators.vd2Date, indicators.vd3Date].filter(Boolean).length
                        : 0,
                },
                lastUpdate: indicators?.lastUpdated,
            };
        });

        const summary = {
            total: pregnantWithStatus.length,
            byStatus: {
                green: pregnantWithStatus.filter(p => 
                    Object.values(p.indicators).every(s => s === 'GREEN')
                ).length,
                yellow: pregnantWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'YELLOW') &&
                    !Object.values(p.indicators).some(s => s === 'RED')
                ).length,
                red: pregnantWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'RED')
                ).length,
            },
        };

        return {
            summary,
            pregnant: pregnantWithStatus,
        };
    }

    /**
     * Relatório de Indicadores de Diabetes (C4)
     */
    async getDiabetesIndicatorsReport(microAreaId?: string) {
        const where: any = {
            hasDiabetes: true,
            deletedAt: null,
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const diabetics = await prisma.patients.findMany({
            where,
            include: {
                diabetes_indicators: true,
                micro_areas: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { fullName: 'asc' },
        });

        const diabeticsWithStatus = diabetics.map(patient => {
            const indicators = patient.diabetes_indicators;

            return {
                id: patient.id,
                name: patient.fullName,
                age: Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                microArea: patient.micro_areas.name,
                indicators: {
                    d1: indicators?.d1Status || 'GRAY', // Consulta últimos 6 meses
                    d2: indicators?.d2Status || 'GRAY', // PA últimos 6 meses
                    d3: indicators?.d3Status || 'GRAY', // Peso/altura últimos 12 meses
                    d4: indicators?.d4Status || 'GRAY', // 2 visitas ACS
                    d5: indicators?.d5Status || 'GRAY', // HbA1c últimos 12 meses
                    d6: indicators?.d6Status || 'GRAY', // Avaliação dos pés
                },
                lastConsultation: indicators?.lastConsultationDate,
                lastHbA1c: indicators?.lastHba1cDate,
                lastFootExam: indicators?.lastFootExamDate,
                lastUpdate: indicators?.lastUpdated,
            };
        });

        const summary = {
            total: diabeticsWithStatus.length,
            byStatus: {
                green: diabeticsWithStatus.filter(p => 
                    Object.values(p.indicators).every(s => s === 'GREEN')
                ).length,
                yellow: diabeticsWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'YELLOW') &&
                    !Object.values(p.indicators).some(s => s === 'RED')
                ).length,
                red: diabeticsWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'RED')
                ).length,
            },
        };

        return {
            summary,
            patients: diabeticsWithStatus,
        };
    }

    /**
     * Relatório de Indicadores de Hipertensão (C5)
     */
    async getHypertensionIndicatorsReport(microAreaId?: string) {
        const where: any = {
            hasHypertension: true,
            deletedAt: null,
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const hypertensives = await prisma.patients.findMany({
            where,
            include: {
                hypertension_indicators: true,
                micro_areas: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { fullName: 'asc' },
        });

        const hypertensivesWithStatus = hypertensives.map(patient => {
            const indicators = patient.hypertension_indicators;

            return {
                id: patient.id,
                name: patient.fullName,
                age: Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                microArea: patient.micro_areas.name,
                indicators: {
                    e1: indicators?.e1Status || 'GRAY', // Consulta últimos 6 meses
                    e2: indicators?.e2Status || 'GRAY', // PA últimos 6 meses
                    e3: indicators?.e3Status || 'GRAY', // Peso/altura últimos 12 meses
                    e4: indicators?.e4Status || 'GRAY', // 2 visitas ACS
                },
                lastConsultation: indicators?.lastConsultationDate,
                lastBP: indicators?.lastBloodPressureDate,
                lastAnthropometry: indicators?.lastAnthropometryDate,
                lastUpdate: indicators?.lastUpdated,
            };
        });

        const summary = {
            total: hypertensivesWithStatus.length,
            byStatus: {
                green: hypertensivesWithStatus.filter(p => 
                    Object.values(p.indicators).every(s => s === 'GREEN')
                ).length,
                yellow: hypertensivesWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'YELLOW') &&
                    !Object.values(p.indicators).some(s => s === 'RED')
                ).length,
                red: hypertensivesWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'RED')
                ).length,
            },
        };

        return {
            summary,
            patients: hypertensivesWithStatus,
        };
    }

    /**
     * Relatório de Indicadores de Idoso (C6)
     */
    async getElderlyIndicatorsReport(microAreaId?: string) {
        const where: any = {
            isElderly: true,
            deletedAt: null,
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const elderly = await prisma.patients.findMany({
            where,
            include: {
                elderly_indicators: true,
                micro_areas: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { fullName: 'asc' },
        });

        const elderlyWithStatus = elderly.map(patient => {
            const indicators = patient.elderly_indicators;

            return {
                id: patient.id,
                name: patient.fullName,
                age: Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                microArea: patient.micro_areas.name,
                indicators: {
                    f1: indicators?.f1Status || 'GRAY', // Consulta últimos 12 meses
                    f2: indicators?.f2Status || 'GRAY', // Peso/altura últimos 12 meses
                    f3: indicators?.c3Status || 'GRAY', // 2 visitas ACS
                    f4: indicators?.dStatus || 'GRAY', // Vacina influenza
                },
                lastConsultation: indicators?.lastConsultationDate,
                lastAnthropometry: indicators?.lastAnthropometryDate,
                lastInfluenzaVaccine: indicators?.lastInfluenzaVaccineDate,
                lastUpdate: indicators?.lastUpdated,
            };
        });

        const summary = {
            total: elderlyWithStatus.length,
            byStatus: {
                green: elderlyWithStatus.filter(p => 
                    Object.values(p.indicators).every(s => s === 'GREEN')
                ).length,
                yellow: elderlyWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'YELLOW') &&
                    !Object.values(p.indicators).some(s => s === 'RED')
                ).length,
                red: elderlyWithStatus.filter(p => 
                    Object.values(p.indicators).some(s => s === 'RED')
                ).length,
            },
        };

        return {
            summary,
            patients: elderlyWithStatus,
        };
    }

    /**
     * Relatório de Indicadores de Saúde da Mulher (C7)
     */
    async getWomanHealthIndicatorsReport(microAreaId?: string) {
        const where: any = {
            sex: 'FEMALE',
            deletedAt: null,
        };

        if (microAreaId) {
            where.microAreaId = microAreaId;
        }

        const women = await prisma.patients.findMany({
            where,
            include: {
                woman_health_indicators: true,
                micro_areas: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { fullName: 'asc' },
        });

        const womenWithStatus = women.map(patient => {
            const indicators = patient.woman_health_indicators;
            const age = Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

            return {
                id: patient.id,
                name: patient.fullName,
                age,
                microArea: patient.micro_areas.name,
                indicators: {
                    g1: indicators?.g1Status || 'GRAY', // Citopatológico (25-64 anos)
                    g2: indicators?.g2Status || 'GRAY', // Mamografia (50-69 anos)
                },
                lastPapSmear: indicators?.lastPapSmearDate,
                lastMammography: indicators?.lastMammographyDate,
                lastUpdate: indicators?.lastUpdated,
                eligible: {
                    papSmear: age >= 25 && age <= 64,
                    mammography: age >= 50 && age <= 69,
                },
            };
        });

        const summary = {
            total: womenWithStatus.length,
            eligible: {
                papSmear: womenWithStatus.filter(w => w.eligible.papSmear).length,
                mammography: womenWithStatus.filter(w => w.eligible.mammography).length,
            },
            byStatus: {
                green: womenWithStatus.filter(w => 
                    Object.values(w.indicators).every(s => s === 'GREEN' || s === 'GRAY')
                ).length,
                yellow: womenWithStatus.filter(w => 
                    Object.values(w.indicators).some(s => s === 'YELLOW') &&
                    !Object.values(w.indicators).some(s => s === 'RED')
                ).length,
                red: womenWithStatus.filter(w => 
                    Object.values(w.indicators).some(s => s === 'RED')
                ).length,
            },
        };

        return {
            summary,
            patients: womenWithStatus,
        };
    }

    // Métodos auxiliares privados

    private groupPatientsByAddress(patients: any[]) {
        const familiesMap = new Map<string, any[]>();

        patients.forEach(patient => {
            const address = `${patient.street}, ${patient.number}`;
            if (!familiesMap.has(address)) {
                familiesMap.set(address, []);
            }
            familiesMap.get(address)!.push(patient);
        });

        return Array.from(familiesMap.entries()).map(([address, members]) => ({
            address,
            totalMembers: members.length,
            members: members.map(m => ({
                name: m.fullName,
                birthDate: m.birthDate,
                age: Math.floor((Date.now() - m.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
                sex: m.sex,
                cpf: m.cpf,
                cns: m.cns,
                programs: [
                    m.isPregnant ? 'Gestante' : null,
                    m.isChild ? 'Criança <2 anos' : null,
                    m.hasHypertension ? 'Hipertenso' : null,
                    m.hasDiabetes ? 'Diabético' : null,
                    m.isElderly ? 'Idoso' : null,
                ].filter(Boolean),
            })),
        }));
    }
}
