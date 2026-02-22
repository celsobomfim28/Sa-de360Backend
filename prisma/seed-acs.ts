import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('👥 Criando Agentes Comunitários de Saúde...');

    const hashedPassword = await bcrypt.hash('senha123', 12);

    // Buscar microáreas
    const microArea1 = await prisma.microArea.findFirst({
        where: { code: 'MA-001' }
    });

    const microArea2 = await prisma.microArea.findFirst({
        where: { code: 'MA-002' }
    });

    if (!microArea1 || !microArea2) {
        console.error('❌ Microáreas não encontradas. Execute o seed principal primeiro.');
        return;
    }

    // Criar ACS para Microárea 01
    console.log('  📍 Criando ACS para Microárea 01...');
    const acs1 = await prisma.user.upsert({
        where: { cpf: '11122233344' },
        update: {
            microAreaId: microArea1.id
        },
        create: {
            cpf: '11122233344',
            fullName: 'Maria das Graças Silva',
            email: 'maria.silva@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.ACS,
            microAreaId: microArea1.id,
        },
    });

    // Criar ACS para Microárea 02
    console.log('  📍 Criando ACS para Microárea 02...');
    const acs2 = await prisma.user.upsert({
        where: { cpf: '22233344455' },
        update: {
            microAreaId: microArea2.id
        },
        create: {
            cpf: '22233344455',
            fullName: 'João Carlos Santos',
            email: 'joao.santos@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.ACS,
            microAreaId: microArea2.id,
        },
    });

    // Criar Enfermeiro
    console.log('  📍 Criando Enfermeiro...');
    await prisma.user.upsert({
        where: { cpf: '33344455566' },
        update: {},
        create: {
            cpf: '33344455566',
            fullName: 'Ana Paula Oliveira',
            email: 'ana.oliveira@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.ENFERMEIRO,
        },
    });

    // Criar Médico
    console.log('  📍 Criando Médico...');
    await prisma.user.upsert({
        where: { cpf: '44455566677' },
        update: {},
        create: {
            cpf: '44455566677',
            fullName: 'Dr. Roberto Mendes',
            email: 'roberto.mendes@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.MEDICO,
        },
    });

    // Criar Técnico de Enfermagem
    console.log('  📍 Criando Técnico de Enfermagem...');
    await prisma.user.upsert({
        where: { cpf: '55566677788' },
        update: {},
        create: {
            cpf: '55566677788',
            fullName: 'Carla Fernandes',
            email: 'carla.fernandes@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.TECNICO_ENFERMAGEM,
        },
    });

    console.log('✅ Usuários criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ACS - Maria das Graças Silva (Microárea 01)');
    console.log('    CPF: 111.222.333-44');
    console.log('    Senha: senha123');
    console.log('');
    console.log('  ACS - João Carlos Santos (Microárea 02)');
    console.log('    CPF: 222.333.444-55');
    console.log('    Senha: senha123');
    console.log('');
    console.log('  Enfermeiro - Ana Paula Oliveira');
    console.log('    CPF: 333.444.555-66');
    console.log('    Senha: senha123');
    console.log('');
    console.log('  Médico - Dr. Roberto Mendes');
    console.log('    CPF: 444.555.666-77');
    console.log('    Senha: senha123');
    console.log('');
    console.log('  Técnico de Enfermagem - Carla Fernandes');
    console.log('    CPF: 555.666.777-88');
    console.log('    Senha: senha123');
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
