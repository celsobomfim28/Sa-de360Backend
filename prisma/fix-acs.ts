import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Corrigindo atribuição de ACS...\n');

    // Remover Maria das Graças da Microárea 01
    const maria = await prisma.user.findFirst({
        where: { cpf: '11122233344' }
    });

    if (maria) {
        await prisma.user.update({
            where: { id: maria.id },
            data: { microAreaId: null }
        });
        console.log('✅ Maria das Graças Silva removida da Microárea 01');
    }

    // Verificar status final
    console.log('\n📊 Status das Microáreas:');
    const microAreas = await prisma.microArea.findMany({
        include: {
            acs: {
                select: {
                    fullName: true,
                    cpf: true
                }
            },
            _count: {
                select: {
                    patients: true
                }
            }
        }
    });

    microAreas.forEach(ma => {
        console.log(`\n  ${ma.name} (${ma.code})`);
        console.log(`    Pacientes: ${ma._count.patients}`);
        console.log(`    ACS: ${ma.acs.length > 0 ? ma.acs.map(a => a.fullName).join(', ') : 'Nenhum'}`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
