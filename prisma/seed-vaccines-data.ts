import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seedVaccinesData() {
    console.log('🔄 Iniciando seed de vacinas...');

    try {
        // 1. Criar vacinas do calendário nacional
        console.log('📋 Criando vacinas do calendário nacional...');

        const vaccines = [
            {
                id: uuidv4(),
                name: 'BCG',
                description: 'Vacina contra tuberculose',
                ageSchedule: {
                    doses: [{ dose: 1, ageMonths: 0, description: 'Ao nascer' }],
                },
            },
            {
                id: uuidv4(),
                name: 'Hepatite B',
                description: 'Vacina contra hepatite B',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 0, description: 'Ao nascer' },
                        { dose: 2, ageMonths: 2, description: '2 meses' },
                        { dose: 3, ageMonths: 6, description: '6 meses' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Pentavalente',
                description: 'Vacina contra difteria, tétano, coqueluche, hepatite B e Haemophilus influenzae tipo b',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 2, description: '2 meses' },
                        { dose: 2, ageMonths: 4, description: '4 meses' },
                        { dose: 3, ageMonths: 6, description: '6 meses' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Poliomielite (VIP/VOP)',
                description: 'Vacina contra poliomielite',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 2, description: '2 meses (VIP)' },
                        { dose: 2, ageMonths: 4, description: '4 meses (VIP)' },
                        { dose: 3, ageMonths: 6, description: '6 meses (VIP)' },
                        { dose: 4, ageMonths: 15, description: '15 meses (VOP - reforço)' },
                        { dose: 5, ageMonths: 48, description: '4 anos (VOP - reforço)' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Rotavírus',
                description: 'Vacina contra rotavírus',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 2, description: '2 meses' },
                        { dose: 2, ageMonths: 4, description: '4 meses' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Pneumocócica 10-valente',
                description: 'Vacina contra pneumococo',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 2, description: '2 meses' },
                        { dose: 2, ageMonths: 4, description: '4 meses' },
                        { dose: 3, ageMonths: 12, description: '12 meses (reforço)' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Meningocócica C',
                description: 'Vacina contra meningite C',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 3, description: '3 meses' },
                        { dose: 2, ageMonths: 5, description: '5 meses' },
                        { dose: 3, ageMonths: 12, description: '12 meses (reforço)' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Febre Amarela',
                description: 'Vacina contra febre amarela',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 9, description: '9 meses' },
                        { dose: 2, ageMonths: 48, description: '4 anos (reforço)' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Tríplice Viral (SCR)',
                description: 'Vacina contra sarampo, caxumba e rubéola',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 12, description: '12 meses' },
                        { dose: 2, ageMonths: 15, description: '15 meses' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Tetraviral (SCRV)',
                description: 'Vacina contra sarampo, caxumba, rubéola e varicela',
                ageSchedule: {
                    doses: [{ dose: 1, ageMonths: 15, description: '15 meses' }],
                },
            },
            {
                id: uuidv4(),
                name: 'Hepatite A',
                description: 'Vacina contra hepatite A',
                ageSchedule: {
                    doses: [{ dose: 1, ageMonths: 15, description: '15 meses' }],
                },
            },
            {
                id: uuidv4(),
                name: 'DTP',
                description: 'Vacina contra difteria, tétano e coqueluche',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 15, description: '15 meses (reforço)' },
                        { dose: 2, ageMonths: 48, description: '4 anos (reforço)' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Varicela',
                description: 'Vacina contra varicela (catapora)',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 15, description: '15 meses' },
                        { dose: 2, ageMonths: 48, description: '4 anos' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'HPV',
                description: 'Vacina contra papilomavírus humano',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 108, description: '9 anos (meninas e meninos)' },
                        { dose: 2, ageMonths: 114, description: '6 meses após a 1ª dose' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'dT (dupla adulto)',
                description: 'Vacina contra difteria e tétano',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 84, description: '7 anos' },
                        { dose: 2, ageMonths: 0, description: 'Reforço a cada 10 anos' },
                    ],
                },
            },
            {
                id: uuidv4(),
                name: 'Influenza',
                description: 'Vacina contra gripe',
                ageSchedule: {
                    doses: [{ dose: 1, ageMonths: 6, description: 'Anual a partir de 6 meses' }],
                },
            },
            {
                id: uuidv4(),
                name: 'COVID-19',
                description: 'Vacina contra COVID-19',
                ageSchedule: {
                    doses: [
                        { dose: 1, ageMonths: 6, description: '1ª dose' },
                        { dose: 2, ageMonths: 6, description: '2ª dose' },
                        { dose: 3, ageMonths: 6, description: 'Reforço' },
                    ],
                },
            },
        ];

        for (const vaccine of vaccines) {
            await prisma.vaccines.upsert({
                where: { name: vaccine.name },
                update: vaccine,
                create: vaccine,
            });
        }

        console.log(`✅ ${vaccines.length} vacinas criadas/atualizadas`);

        // 2. Criar registros de vacinas aplicadas (exemplos)
        console.log('💉 Criando registros de vacinas aplicadas...');

        // Buscar alguns pacientes e profissionais para criar registros de exemplo
        const patients = await prisma.patients.findMany({
            where: { isChild: true },
            take: 10,
        });

        const professionals = await prisma.users.findMany({
            where: {
                role: { in: ['TECNICO_ENFERMAGEM', 'ENFERMEIRO'] },
                isActive: true,
            },
            take: 5,
        });

        if (patients.length > 0 && professionals.length > 0) {
            const vaccineRecords = [];
            const bcgVaccine = vaccines.find(v => v.name === 'BCG');
            const hepatiteBVaccine = vaccines.find(v => v.name === 'Hepatite B');
            const pentavalenteVaccine = vaccines.find(v => v.name === 'Pentavalente');

            // Criar alguns registros de exemplo
            for (let i = 0; i < Math.min(patients.length, 5); i++) {
                const patient = patients[i];
                const professional = professionals[i % professionals.length];

                // BCG ao nascer
                if (bcgVaccine) {
                    vaccineRecords.push({
                        id: uuidv4(),
                        patientId: patient.id,
                        vaccineId: bcgVaccine.id,
                        applicationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                        dose: 1,
                        batchNumber: `BCG${Math.floor(Math.random() * 10000)}`,
                        appliedById: professional.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                // Hepatite B - 1ª dose
                if (hepatiteBVaccine) {
                    vaccineRecords.push({
                        id: uuidv4(),
                        patientId: patient.id,
                        vaccineId: hepatiteBVaccine.id,
                        applicationDate: new Date(Date.now() - Math.random() * 300 * 24 * 60 * 60 * 1000),
                        dose: 1,
                        batchNumber: `HEPB${Math.floor(Math.random() * 10000)}`,
                        appliedById: professional.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }

                // Pentavalente - 1ª dose
                if (pentavalenteVaccine) {
                    vaccineRecords.push({
                        id: uuidv4(),
                        patientId: patient.id,
                        vaccineId: pentavalenteVaccine.id,
                        applicationDate: new Date(Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000),
                        dose: 1,
                        batchNumber: `PENTA${Math.floor(Math.random() * 10000)}`,
                        appliedById: professional.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }

            // Inserir registros
            for (const record of vaccineRecords) {
                await prisma.vaccine_records.create({
                    data: record,
                });
            }

            console.log(`✅ ${vaccineRecords.length} registros de vacinas criados`);
        } else {
            console.log('⚠️  Não há pacientes ou profissionais suficientes para criar registros de exemplo');
        }

        console.log('✅ Seed de vacinas concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao executar seed de vacinas:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedVaccinesData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
