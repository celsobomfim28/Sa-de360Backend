import { PrismaClient, Sex } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Limpando pacientes existentes...');
    
    // Deletar todos os registros relacionados a pacientes
    await prisma.auditLog.deleteMany({});
    await prisma.vaccineRecord.deleteMany({});
    await prisma.womanExam.deleteMany({});
    await prisma.elderlyConsultation.deleteMany({});
    await prisma.hypertensionConsultation.deleteMany({});
    await prisma.diabetesConsultation.deleteMany({});
    await prisma.childcareConsultation.deleteMany({});
    await prisma.postpartumConsultation.deleteMany({});
    await prisma.prenatalExam.deleteMany({});
    await prisma.prenatalConsultation.deleteMany({});
    await prisma.homeVisit.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.womanHealthIndicator.deleteMany({});
    await prisma.elderlyIndicator.deleteMany({});
    await prisma.hypertensionIndicator.deleteMany({});
    await prisma.diabetesIndicator.deleteMany({});
    await prisma.childcareIndicator.deleteMany({});
    await prisma.prenatalIndicator.deleteMany({});
    await prisma.prenatalData.deleteMany({});
    await prisma.patient.deleteMany({});
    
    console.log('✅ Pacientes removidos');

    // Buscar microárea 01
    const microArea = await prisma.microArea.findFirst({
        where: { code: 'MA-001' }
    });

    if (!microArea) {
        console.error('❌ Microárea 01 não encontrada. Execute o seed principal primeiro.');
        return;
    }

    // Buscar usuário admin para ser o criador
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (!admin) {
        console.error('❌ Usuário admin não encontrado. Execute o seed principal primeiro.');
        return;
    }

    console.log('👥 Criando pacientes de teste...');

    // 1. Paciente Hipertenso
    console.log('  📍 Criando paciente hipertenso...');
    const hipertenso = await prisma.patient.create({
        data: {
            cpf: '11111111111',
            cns: '111111111111111',
            fullName: 'João Silva Santos',
            birthDate: new Date('1970-05-15'),
            sex: Sex.MALE,
            motherName: 'Maria Silva Santos',
            street: 'Rua das Flores',
            number: '100',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4321',
            hasHypertension: true,
            hypertensionDiagnosisDate: new Date('2020-03-10'),
            createdById: admin.id,
        }
    });

    await prisma.hypertensionIndicator.create({
        data: {
            patientId: hipertenso.id,
            e1Status: 'RED',
            e2Status: 'RED',
            e3Status: 'RED',
            e4Status: 'RED',
        }
    });

    // 2. Paciente Diabético
    console.log('  📍 Criando paciente diabético...');
    const diabetico = await prisma.patient.create({
        data: {
            cpf: '22222222222',
            cns: '222222222222222',
            fullName: 'Maria Oliveira Costa',
            birthDate: new Date('1965-08-20'),
            sex: Sex.FEMALE,
            motherName: 'Ana Oliveira Costa',
            street: 'Rua das Palmeiras',
            number: '200',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4322',
            hasDiabetes: true,
            diabetesDiagnosisDate: new Date('2019-06-15'),
            isWoman: true,
            createdById: admin.id,
        }
    });

    await prisma.diabetesIndicator.create({
        data: {
            patientId: diabetico.id,
            d1Status: 'RED',
            d2Status: 'RED',
            d3Status: 'RED',
            d4Status: 'RED',
            d5Status: 'RED',
            d6Status: 'RED',
        }
    });

    await prisma.womanHealthIndicator.create({
        data: {
            patientId: diabetico.id,
            g1Status: 'RED',
            g2Status: 'RED',
        }
    });

    // 3. Paciente Hipertenso E Diabético
    console.log('  📍 Criando paciente hipertenso e diabético...');
    const hipertensoDiabetico = await prisma.patient.create({
        data: {
            cpf: '33333333333',
            cns: '333333333333333',
            fullName: 'Carlos Pereira Lima',
            birthDate: new Date('1960-12-10'),
            sex: Sex.MALE,
            motherName: 'Rosa Pereira Lima',
            street: 'Rua dos Ipês',
            number: '300',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4323',
            hasHypertension: true,
            hasDiabetes: true,
            hypertensionDiagnosisDate: new Date('2018-01-20'),
            diabetesDiagnosisDate: new Date('2018-01-20'),
            isElderly: true,
            createdById: admin.id,
        }
    });

    await prisma.hypertensionIndicator.create({
        data: {
            patientId: hipertensoDiabetico.id,
            e1Status: 'RED',
            e2Status: 'RED',
            e3Status: 'RED',
            e4Status: 'RED',
        }
    });

    await prisma.diabetesIndicator.create({
        data: {
            patientId: hipertensoDiabetico.id,
            d1Status: 'RED',
            d2Status: 'RED',
            d3Status: 'RED',
            d4Status: 'RED',
            d5Status: 'RED',
            d6Status: 'RED',
        }
    });

    await prisma.elderlyIndicator.create({
        data: {
            patientId: hipertensoDiabetico.id,
            f1Status: 'RED',
            f2Status: 'RED',
        }
    });

    // 4. Gestante
    console.log('  📍 Criando gestante...');
    const lastMenstrualDate = new Date();
    lastMenstrualDate.setDate(lastMenstrualDate.getDate() - 60); // 60 dias atrás (8-9 semanas)
    
    const expectedDeliveryDate = new Date(lastMenstrualDate);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 280);

    const gestante = await prisma.patient.create({
        data: {
            cpf: '44444444444',
            cns: '444444444444444',
            fullName: 'Ana Paula Rodrigues',
            birthDate: new Date('1995-03-25'),
            sex: Sex.FEMALE,
            motherName: 'Paula Rodrigues',
            street: 'Rua das Acácias',
            number: '400',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4324',
            isPregnant: true,
            isWoman: true,
            createdById: admin.id,
        }
    });

    const prenatalData = await prisma.prenatalData.create({
        data: {
            patientId: gestante.id,
            lastMenstrualDate,
            expectedDeliveryDate,
            gestationalAge: 60,
            isHighRisk: false,
            previousPregnancies: 1,
            previousDeliveries: 1,
            previousAbortions: 0,
        }
    });

    await prisma.prenatalIndicator.create({
        data: {
            prenatalDataId: prenatalData.id,
            c1Status: 'RED',
            c2Status: 'RED',
            c3Status: 'RED',
            c4Status: 'RED',
            c5Status: 'RED',
            c6Status: 'RED',
        }
    });

    await prisma.womanHealthIndicator.create({
        data: {
            patientId: gestante.id,
            g1Status: 'RED',
            g2Status: 'RED',
        }
    });

    // 5. Criança (6 meses)
    console.log('  📍 Criando criança...');
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 6);

    const crianca = await prisma.patient.create({
        data: {
            cpf: '55555555555',
            cns: '555555555555555',
            fullName: 'Pedro Henrique Souza',
            birthDate,
            sex: Sex.MALE,
            motherName: 'Juliana Souza',
            street: 'Rua dos Lírios',
            number: '500',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4325',
            isChild: true,
            createdById: admin.id,
        }
    });

    await prisma.childcareIndicator.create({
        data: {
            patientId: crianca.id,
            b1Status: 'RED',
            b2Status: 'RED',
            b3Status: 'RED',
            b4Status: 'RED',
            vaccineStatus: 'NOT_STARTED',
            b5Status: 'RED',
        }
    });

    // 6. Idoso
    console.log('  📍 Criando idoso...');
    const idoso = await prisma.patient.create({
        data: {
            cpf: '66666666666',
            cns: '666666666666666',
            fullName: 'José Antônio Ferreira',
            birthDate: new Date('1950-07-30'),
            sex: Sex.MALE,
            motherName: 'Antônia Ferreira',
            street: 'Rua das Orquídeas',
            number: '600',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4326',
            isElderly: true,
            createdById: admin.id,
        }
    });

    await prisma.elderlyIndicator.create({
        data: {
            patientId: idoso.id,
            f1Status: 'RED',
            f2Status: 'RED',
        }
    });

    // 7. Mulher (Saúde da Mulher)
    console.log('  📍 Criando mulher (saúde da mulher)...');
    const mulher = await prisma.patient.create({
        data: {
            cpf: '77777777777',
            cns: '777777777777777',
            fullName: 'Fernanda Costa Alves',
            birthDate: new Date('1985-11-12'),
            sex: Sex.FEMALE,
            motherName: 'Helena Costa Alves',
            street: 'Rua das Margaridas',
            number: '700',
            neighborhood: 'Centro',
            zipCode: '12345-678',
            microAreaId: microArea.id,
            primaryPhone: '(11) 98765-4327',
            isWoman: true,
            createdById: admin.id,
        }
    });

    await prisma.womanHealthIndicator.create({
        data: {
            patientId: mulher.id,
            g1Status: 'RED',
            g2Status: 'RED',
        }
    });

    console.log('✅ Pacientes de teste criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  1. João Silva Santos - Hipertenso');
    console.log('  2. Maria Oliveira Costa - Diabética + Saúde da Mulher');
    console.log('  3. Carlos Pereira Lima - Hipertenso + Diabético + Idoso');
    console.log('  4. Ana Paula Rodrigues - Gestante + Saúde da Mulher');
    console.log('  5. Pedro Henrique Souza - Criança (6 meses)');
    console.log('  6. José Antônio Ferreira - Idoso');
    console.log('  7. Fernanda Costa Alves - Saúde da Mulher');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Todos os pacientes estão na Microárea 01');
    console.log('✨ Todos os indicadores estão em status RED (crítico)');
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
