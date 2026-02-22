import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Iniciando limpeza do banco de dados...');

    // Ordem de exclusão para evitar erros de chave estrangeira

    console.log('🗑️ Excluindo registros de atendimentos e indicadores...');
    await prisma.prenatalIndicator.deleteMany({});
    await prisma.childcareIndicator.deleteMany({});
    await prisma.diabetesIndicator.deleteMany({});
    await prisma.hypertensionIndicator.deleteMany({});
    await prisma.elderlyIndicator.deleteMany({});
    await prisma.womanHealthIndicator.deleteMany({});

    await prisma.prenatalConsultation.deleteMany({});
    await prisma.postpartumConsultation.deleteMany({});
    await prisma.childcareConsultation.deleteMany({});
    await prisma.elderlyConsultation.deleteMany({});
    await prisma.womanExam.deleteMany({});

    await prisma.prenatalExam.deleteMany({});
    await prisma.prenatalData.deleteMany({});

    await prisma.vaccineRecord.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.homeVisit.deleteMany({});
    await prisma.auditLog.deleteMany({});

    console.log('🗑️ Excluindo pacientes...');
    await prisma.patient.deleteMany({});

    console.log('🗑️ Excluindo usuários (mantendo admin)...');
    // Deletar todos os usuários exceto o admin principal
    await prisma.user.deleteMany({
        where: {
            cpf: {
                not: '00000000000'
            }
        }
    });

    console.log('🗑️ Excluindo microáreas...');
    await prisma.microArea.deleteMany({});

    console.log('🗺️ Recriando microáreas base...');
    const microAreaNames = ['01', '02', '03', '04', '05', '06'];
    for (const name of microAreaNames) {
        await prisma.microArea.create({
            data: {
                name,
                code: `MA${name}`
            }
        });
    }

    console.log('👤 Verificando/Criando Admin...');
    const hashedPassword = await bcrypt.hash('senha123', 12);

    await prisma.user.upsert({
        where: { cpf: '00000000000' },
        update: {
            password: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true,
            deletedAt: null
        },
        create: {
            cpf: '00000000000',
            fullName: 'Administrador do Sistema',
            email: 'admin@saude360.gov.br',
            password: hashedPassword,
            role: UserRole.ADMIN,
        },
    });

    console.log('✨ Banco de dados limpo com sucesso! Apenas o Admin permanece.');
}

main()
    .catch((e) => {
        console.error('❌ Erro durante a limpeza:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
