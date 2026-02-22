import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificando dados do banco...\n');

    // Verificar microáreas
    console.log('📍 MICROÁREAS:');
    const microAreas = await prisma.microArea.findMany({
        include: {
            acs: {
                select: {
                    id: true,
                    fullName: true,
                    cpf: true,
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
        console.log(`  ${ma.name} (${ma.code})`);
        console.log(`    ID: ${ma.id}`);
        console.log(`    Pacientes: ${ma._count.patients}`);
        console.log(`    ACS: ${ma.acs.length > 0 ? ma.acs.map(a => `${a.fullName} (${a.cpf})`).join(', ') : 'Nenhum'}`);
        console.log('');
    });

    // Verificar usuários ACS
    console.log('👥 USUÁRIOS ACS:');
    const acsUsers = await prisma.user.findMany({
        where: { role: 'ACS' },
        include: {
            microArea: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });

    acsUsers.forEach(acs => {
        console.log(`  ${acs.fullName} (CPF: ${acs.cpf})`);
        console.log(`    ID: ${acs.id}`);
        console.log(`    Microárea: ${acs.microArea ? `${acs.microArea.name} (ID: ${acs.microArea.id})` : 'Nenhuma'}`);
        console.log(`    microAreaId: ${acs.microAreaId || 'null'}`);
        console.log('');
    });

    // Verificar pacientes
    console.log('🏥 PACIENTES:');
    const patients = await prisma.patient.findMany({
        where: { deletedAt: null },
        include: {
            microArea: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });

    console.log(`  Total: ${patients.length} pacientes`);
    patients.forEach(p => {
        console.log(`  ${p.fullName}`);
        console.log(`    Microárea: ${p.microArea.name} (ID: ${p.microAreaId})`);
    });
    console.log('');

    // Verificar indicadores
    console.log('📊 INDICADORES:');
    const [diabetes, hypertension, prenatal, childcare, elderly] = await Promise.all([
        prisma.diabetesIndicator.count(),
        prisma.hypertensionIndicator.count(),
        prisma.prenatalIndicator.count(),
        prisma.childcareIndicator.count(),
        prisma.elderlyIndicator.count(),
    ]);

    console.log(`  Diabetes: ${diabetes}`);
    console.log(`  Hipertensão: ${hypertension}`);
    console.log(`  Pré-natal: ${prenatal}`);
    console.log(`  Puericultura: ${childcare}`);
    console.log(`  Idoso: ${elderly}`);
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
