import { PrismaClient, UserRole, Sex } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar microáreas
    console.log('📍 Criando microáreas...');
    const microArea1 = await prisma.micro_areas.upsert({
        where: { code: 'MA-001' },
        update: {},
        create: {
            id: crypto.randomUUID(),
            name: 'Microárea 01',
            code: 'MA-001',
            description: 'Bairro Centro - Região Norte',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    const microArea2 = await prisma.micro_areas.upsert({
        where: { code: 'MA-002' },
        update: {},
        create: {
            id: crypto.randomUUID(),
            name: 'Microárea 02',
            code: 'MA-002',
            description: 'Bairro Jardim - Região Sul',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    console.log('✅ Microáreas criadas');

    // Criar usuários
    console.log('👥 Criando usuários...');
    const hashedPassword = await bcrypt.hash('senha123', 12);

    const admin = await prisma.users.upsert({
        where: { cpf: '00000000000' },
        update: {},
        create: {
            id: crypto.randomUUID(),
            cpf: '00000000000',
            fullName: 'Administrador do Sistema',
            email: 'admin@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    console.log('✅ Usuários criados');

    // Criar vacinas
    console.log('💉 Criando vacinas...');
    const vaccines = [
        // ============================================
        // VACINAS PARA CRIANÇAS (C2 - Indicador B5)
        // ============================================
        {
            name: 'BCG',
            description: 'Bacilo Calmette-Guérin',
            ageSchedule: [{ dose: 1, ageInMonths: 0, description: 'Ao nascer' }],
        },
        {
            name: 'Hepatite B',
            description: 'Vacina contra Hepatite B',
            ageSchedule: [
                { dose: 1, ageInMonths: 0, description: 'Ao nascer' },
                { dose: 2, ageInMonths: 2, description: '2 meses' },
                { dose: 3, ageInMonths: 6, description: '6 meses' },
            ],
        },
        {
            name: 'DTP',
            description: 'Difteria, Tétano e Coqueluche',
            ageSchedule: [
                { dose: 1, ageInMonths: 2, description: '2 meses' },
                { dose: 2, ageInMonths: 4, description: '4 meses' },
                { dose: 3, ageInMonths: 6, description: '6 meses' },
                { dose: 4, ageInMonths: 15, description: '15 meses' },
            ],
        },
        {
            name: 'Pólio',
            description: 'Vacina Inativada Poliomielite',
            ageSchedule: [
                { dose: 1, ageInMonths: 2, description: '2 meses' },
                { dose: 2, ageInMonths: 4, description: '4 meses' },
                { dose: 3, ageInMonths: 6, description: '6 meses' },
                { dose: 4, ageInMonths: 15, description: '15 meses' },
            ],
        },
        {
            name: 'Rotavírus',
            description: 'Vacina Oral Rotavírus Humano',
            ageSchedule: [
                { dose: 1, ageInMonths: 2, description: '2 meses' },
                { dose: 2, ageInMonths: 4, description: '4 meses' },
            ],
        },
        {
            name: 'Pneumocócica',
            description: 'Vacina Pneumocócica 10-valente',
            ageSchedule: [
                { dose: 1, ageInMonths: 2, description: '2 meses' },
                { dose: 2, ageInMonths: 4, description: '4 meses' },
                { dose: 3, ageInMonths: 6, description: '6 meses' },
                { dose: 4, ageInMonths: 12, description: '12 meses' },
            ],
        },
        {
            name: 'Meningocócica',
            description: 'Vacina Meningocócica C',
            ageSchedule: [
                { dose: 1, ageInMonths: 3, description: '3 meses' },
                { dose: 2, ageInMonths: 5, description: '5 meses' },
                { dose: 3, ageInMonths: 12, description: '12 meses' },
            ],
        },
        {
            name: 'Tríplice Viral',
            description: 'Sarampo, Caxumba e Rubéola',
            ageSchedule: [{ dose: 1, ageInMonths: 12, description: '12 meses' }],
        },
        {
            name: 'Hepatite A',
            description: 'Vacina contra Hepatite A',
            ageSchedule: [{ dose: 1, ageInMonths: 15, description: '15 meses' }],
        },
        {
            name: 'Haemophilus influenzae tipo b',
            description: 'Vacina Hib (Pentavalente)',
            ageSchedule: [
                { dose: 1, ageInMonths: 2, description: '2 meses' },
                { dose: 2, ageInMonths: 4, description: '4 meses' },
                { dose: 3, ageInMonths: 6, description: '6 meses' },
            ],
        },
        // ============================================
        // VACINAS PARA GESTANTES (C3 - Indicador F)
        // ============================================
        {
            name: 'dTpa',
            description: 'Difteria, Tétano e Coqueluche (gestantes)',
            ageSchedule: [{ dose: 1, ageInMonths: 0, description: 'A partir da 20ª semana de gestação' }],
        },
        // ============================================
        // VACINAS PARA IDOSOS (C6 - Indicador D)
        // ============================================
        {
            name: 'Influenza',
            description: 'Vacina contra Gripe (Influenza)',
            ageSchedule: [{ dose: 1, ageInMonths: 0, description: 'Dose anual para idosos 60+' }],
        },
        // ============================================
        // VACINAS PARA MULHERES (C7 - Indicador B)
        // ============================================
        {
            name: 'HPV',
            description: 'Papilomavírus Humano (9-14 anos)',
            ageSchedule: [
                { dose: 1, ageInMonths: 108, description: '9 anos - 1ª dose' },
                { dose: 2, ageInMonths: 114, description: '6 meses após 1ª dose' },
            ],
        },
    ];

    for (const vaccine of vaccines) {
        await prisma.vaccines.upsert({
            where: { name: vaccine.name },
            update: {},
            create: {
                id: crypto.randomUUID(),
                name: vaccine.name,
                description: vaccine.description,
                ageSchedule: vaccine.ageSchedule,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    console.log('✅ Vacinas criadas');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  CPF: 00000000000');
    console.log('  Senha: senha123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
