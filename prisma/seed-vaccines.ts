import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Catálogo de Vacinas do Programa Nacional de Imunizações (PNI)
 * Baseado no Calendário Nacional de Vacinação 2024
 */

const vaccines = [
    // ============================================
    // VACINAS PARA CRIANÇAS (0-10 ANOS)
    // ============================================
    {
        name: 'BCG',
        description: 'Bacilo Calmette-Guérin - Tuberculose',
        ageGroup: 'CHILD',
        doses: 1,
        minAgeMonths: 0,
        maxAgeMonths: 0,
        intervalDays: null,
        isActive: true,
        observations: 'Dose única ao nascer'
    },
    {
        name: 'Hepatite B',
        description: 'Vacina contra Hepatite B',
        ageGroup: 'CHILD',
        doses: 4,
        minAgeMonths: 0,
        maxAgeMonths: 24,
        intervalDays: 30,
        isActive: true,
        observations: 'Ao nascer, 2, 4 e 6 meses'
    },
    {
        name: 'Pentavalente',
        description: 'DTP + Hib + Hepatite B',
        ageGroup: 'CHILD',
        doses: 3,
        minAgeMonths: 2,
        maxAgeMonths: 6,
        intervalDays: 60,
        isActive: true,
        observations: '2, 4 e 6 meses'
    },
    {
        name: 'VIP',
        description: 'Vacina Inativada Poliomielite',
        ageGroup: 'CHILD',
        doses: 3,
        minAgeMonths: 2,
        maxAgeMonths: 6,
        intervalDays: 60,
        isActive: true,
        observations: '2, 4 e 6 meses'
    },
    {
        name: 'VOP',
        description: 'Vacina Oral Poliomielite',
        ageGroup: 'CHILD',
        doses: 2,
        minAgeMonths: 15,
        maxAgeMonths: 48,
        intervalDays: 180,
        isActive: true,
        observations: 'Reforço aos 15 meses e 4 anos'
    },
    {
        name: 'Pneumocócica 10',
        description: 'Vacina Pneumocócica 10-valente',
        ageGroup: 'CHILD',
        doses: 3,
        minAgeMonths: 2,
        maxAgeMonths: 12,
        intervalDays: 60,
        isActive: true,
        observations: '2, 4 e 6 meses + reforço aos 12 meses'
    },
    {
        name: 'Rotavírus',
        description: 'Vacina Rotavírus Humano',
        ageGroup: 'CHILD',
        doses: 2,
        minAgeMonths: 2,
        maxAgeMonths: 4,
        intervalDays: 60,
        isActive: true,
        observations: '2 e 4 meses'
    },
    {
        name: 'Meningocócica C',
        description: 'Vacina Meningocócica C conjugada',
        ageGroup: 'CHILD',
        doses: 3,
        minAgeMonths: 3,
        maxAgeMonths: 12,
        intervalDays: 60,
        isActive: true,
        observations: '3, 5 e 12 meses'
    },
    {
        name: 'Febre Amarela',
        description: 'Vacina Febre Amarela',
        ageGroup: 'CHILD',
        doses: 2,
        minAgeMonths: 9,
        maxAgeMonths: 48,
        intervalDays: null,
        isActive: true,
        observations: '9 meses e 4 anos'
    },
    {
        name: 'Tríplice Viral',
        description: 'Sarampo, Caxumba e Rubéola',
        ageGroup: 'CHILD',
        doses: 2,
        minAgeMonths: 12,
        maxAgeMonths: 15,
        intervalDays: 90,
        isActive: true,
        observations: '12 e 15 meses'
    },
    {
        name: 'Tetra Viral',
        description: 'Sarampo, Caxumba, Rubéola e Varicela',
        ageGroup: 'CHILD',
        doses: 1,
        minAgeMonths: 15,
        maxAgeMonths: 15,
        intervalDays: null,
        isActive: true,
        observations: '15 meses (pode substituir 2ª dose da Tríplice Viral)'
    },
    {
        name: 'Hepatite A',
        description: 'Vacina contra Hepatite A',
        ageGroup: 'CHILD',
        doses: 1,
        minAgeMonths: 15,
        maxAgeMonths: 15,
        intervalDays: null,
        isActive: true,
        observations: 'Dose única aos 15 meses'
    },
    {
        name: 'DTP',
        description: 'Tríplice Bacteriana (Difteria, Tétano, Coqueluche)',
        ageGroup: 'CHILD',
        doses: 2,
        minAgeMonths: 15,
        maxAgeMonths: 48,
        intervalDays: 180,
        isActive: true,
        observations: 'Reforço aos 15 meses e 4 anos'
    },
    {
        name: 'Varicela',
        description: 'Vacina contra Varicela (Catapora)',
        ageGroup: 'CHILD',
        doses: 2,
        minAgeMonths: 12,
        maxAgeMonths: 48,
        intervalDays: 90,
        isActive: true,
        observations: '12 meses e 4 anos'
    },

    // ============================================
    // VACINAS PARA ADOLESCENTES (11-19 ANOS)
    // ============================================
    {
        name: 'HPV',
        description: 'Papilomavírus Humano',
        ageGroup: 'ADOLESCENT',
        doses: 2,
        minAgeMonths: 108, // 9 anos
        maxAgeMonths: 168, // 14 anos
        intervalDays: 180,
        isActive: true,
        observations: 'Meninas e meninos de 9 a 14 anos'
    },
    {
        name: 'Meningocócica ACWY',
        description: 'Vacina Meningocócica ACWY',
        ageGroup: 'ADOLESCENT',
        doses: 1,
        minAgeMonths: 132, // 11 anos
        maxAgeMonths: 144, // 12 anos
        intervalDays: null,
        isActive: true,
        observations: 'Dose única aos 11-12 anos'
    },
    {
        name: 'dT',
        description: 'Dupla Adulto (Difteria e Tétano)',
        ageGroup: 'ADOLESCENT',
        doses: 1,
        minAgeMonths: 132, // 11 anos
        maxAgeMonths: 228, // 19 anos
        intervalDays: null,
        isActive: true,
        observations: 'Reforço a cada 10 anos'
    },

    // ============================================
    // VACINAS PARA GESTANTES
    // ============================================
    {
        name: 'dTpa',
        description: 'Tríplice Bacteriana Acelular (Difteria, Tétano, Coqueluche)',
        ageGroup: 'PREGNANT',
        doses: 1,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: null,
        isActive: true,
        observations: 'A partir da 20ª semana de gestação'
    },
    {
        name: 'Hepatite B (Gestante)',
        description: 'Vacina contra Hepatite B para gestantes',
        ageGroup: 'PREGNANT',
        doses: 3,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: 30,
        isActive: true,
        observations: 'Esquema completo se não vacinada'
    },

    // ============================================
    // VACINAS PARA IDOSOS (60+ ANOS)
    // ============================================
    {
        name: 'Influenza',
        description: 'Vacina contra Gripe',
        ageGroup: 'ELDERLY',
        doses: 1,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: 365,
        isActive: true,
        observations: 'Anual, preferencialmente antes do inverno'
    },
    {
        name: 'Pneumocócica 23',
        description: 'Vacina Pneumocócica 23-valente',
        ageGroup: 'ELDERLY',
        doses: 1,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: null,
        isActive: true,
        observations: 'Dose única para idosos'
    },
    {
        name: 'dT (Idoso)',
        description: 'Dupla Adulto para Idosos',
        ageGroup: 'ELDERLY',
        doses: 1,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: 3650, // 10 anos
        isActive: true,
        observations: 'Reforço a cada 10 anos'
    },

    // ============================================
    // VACINAS PARA ADULTOS (20-59 ANOS)
    // ============================================
    {
        name: 'Hepatite B (Adulto)',
        description: 'Vacina contra Hepatite B para adultos',
        ageGroup: 'ADULT',
        doses: 3,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: 30,
        isActive: true,
        observations: 'Esquema: 0, 1 e 6 meses'
    },
    {
        name: 'Febre Amarela (Adulto)',
        description: 'Vacina Febre Amarela para adultos',
        ageGroup: 'ADULT',
        doses: 1,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: null,
        isActive: true,
        observations: 'Dose única'
    },
    {
        name: 'Tríplice Viral (Adulto)',
        description: 'Sarampo, Caxumba e Rubéola para adultos',
        ageGroup: 'ADULT',
        doses: 2,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: 30,
        isActive: true,
        observations: 'Até 49 anos se não vacinado'
    },
    {
        name: 'dT (Adulto)',
        description: 'Dupla Adulto',
        ageGroup: 'ADULT',
        doses: 1,
        minAgeMonths: null,
        maxAgeMonths: null,
        intervalDays: 3650, // 10 anos
        isActive: true,
        observations: 'Reforço a cada 10 anos'
    },

    // ============================================
    // VACINAS ESPECIAIS
    // ============================================
    {
        name: 'COVID-19',
        description: 'Vacina contra COVID-19',
        ageGroup: 'ALL',
        doses: 3,
        minAgeMonths: 6,
        maxAgeMonths: null,
        intervalDays: 60,
        isActive: true,
        observations: 'Esquema conforme faixa etária e fabricante'
    },
];

async function seedVaccines() {
    console.log('🔬 Iniciando seed de vacinas do PNI...\n');

    try {
        // Limpar vacinas existentes (opcional)
        // await prisma.vaccine.deleteMany({});
        // console.log('🗑️  Vacinas antigas removidas\n');

        // Criar vacinas
        let created = 0;
        let skipped = 0;

        for (const vaccine of vaccines) {
            try {
                // Verificar se já existe
                const existing = await prisma.vaccine.findFirst({
                    where: { name: vaccine.name, ageGroup: vaccine.ageGroup }
                });

                if (existing) {
                    console.log(`⏭️  Vacina já existe: ${vaccine.name} (${vaccine.ageGroup})`);
                    skipped++;
                    continue;
                }

                await prisma.vaccine.create({
                    data: vaccine
                });

                console.log(`✅ Vacina criada: ${vaccine.name} (${vaccine.ageGroup})`);
                created++;
            } catch (error: any) {
                console.error(`❌ Erro ao criar vacina ${vaccine.name}:`, error.message);
            }
        }

        console.log('\n📊 Resumo:');
        console.log(`   ✅ Criadas: ${created}`);
        console.log(`   ⏭️  Ignoradas: ${skipped}`);
        console.log(`   📝 Total no catálogo: ${vaccines.length}`);

        // Estatísticas por faixa etária
        const stats = await prisma.vaccine.groupBy({
            by: ['ageGroup'],
            _count: true
        });

        console.log('\n📈 Vacinas por faixa etária:');
        stats.forEach(stat => {
            console.log(`   ${stat.ageGroup}: ${stat._count} vacinas`);
        });

        console.log('\n✅ Seed de vacinas concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao fazer seed de vacinas:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    seedVaccines();
}

export { seedVaccines };
