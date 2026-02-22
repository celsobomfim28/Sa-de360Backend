import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes
    console.log('🗑️  Limpando dados existentes...');
    await prisma.vaccine_records.deleteMany();
    await prisma.appointments.deleteMany();
    await prisma.home_visits.deleteMany();
    await prisma.childcare_indicators.deleteMany();
    await prisma.diabetes_indicators.deleteMany();
    await prisma.hypertension_indicators.deleteMany();
    await prisma.elderly_indicators.deleteMany();
    await prisma.woman_health_indicators.deleteMany();
    await prisma.prenatal_indicators.deleteMany();
    await prisma.prenatal_consultations.deleteMany();
    await prisma.prenatal_data.deleteMany();
    await prisma.patients.deleteMany();
    await prisma.users.deleteMany();
    await prisma.micro_areas.deleteMany();

    // Criar Microáreas
    console.log('📍 Criando microáreas...');
    const microArea01 = await prisma.micro_areas.create({
        data: {
            id: 'c8c0aa3d-14ce-4a12-98c6-d592c6a0f557',
            name: '01',
            code: 'MA-01',
            description: 'Microárea 01 - Centro'
        }
    });

    const microArea02 = await prisma.micro_areas.create({
        data: {
            id: '7786bffd-f3ae-4a77-931f-7ec781a2cb48',
            name: '02',
            code: 'MA-02',
            description: 'Microárea 02 - Bairro Norte'
        }
    });

    const microArea03 = await prisma.micro_areas.create({
        data: {
            name: '03',
            code: 'MA-03',
            description: 'Microárea 03 - Bairro Sul'
        }
    });

    const microArea04 = await prisma.micro_areas.create({
        data: {
            name: '04',
            code: 'MA-04',
            description: 'Microárea 04 - Bairro Leste'
        }
    });

    const microArea05 = await prisma.micro_areas.create({
        data: {
            name: '05',
            code: 'MA-05',
            description: 'Microárea 05 - Bairro Oeste'
        }
    });

    console.log('✅ Microáreas criadas!');

    // Criar Usuários
    console.log('👥 Criando usuários...');
    const hashedPassword = await bcrypt.hash('senha123', 12);

    // Admin
    const admin = await prisma.users.create({
        data: {
            id: '4f9b2236-cfea-428b-9a0b-3f10a541df91',
            cpf: '00000000000',
            fullName: 'Administrador do Sistema',
            email: 'admin@saude360.com',
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true
        }
    });

    // Médico
    const medico = await prisma.users.create({
        data: {
            cpf: '11111111111',
            fullName: 'Dr. Roberto Mendes',
            email: 'roberto.mendes@saude360.com',
            password: hashedPassword,
            role: 'MEDICO',
            isActive: true
        }
    });

    // Enfermeiro
    const enfermeiro = await prisma.users.create({
        data: {
            cpf: '22222222222',
            fullName: 'Enf. Ana Paula Oliveira',
            email: 'ana.oliveira@saude360.com',
            password: hashedPassword,
            role: 'ENFERMEIRO',
            isActive: true
        }
    });

    // Técnico de Enfermagem
    const tecnicoEnfermagem = await prisma.users.create({
        data: {
            cpf: '33333333333',
            fullName: 'Téc. Carla Fernandes',
            email: 'carla.fernandes@saude360.com',
            password: hashedPassword,
            role: 'TECNICO_ENFERMAGEM',
            isActive: true
        }
    });

    // ACS 1 - Microárea 01
    const acs1 = await prisma.users.create({
        data: {
            cpf: '44444444444',
            fullName: 'Maria das Graças Silva',
            email: 'maria.silva@saude360.com',
            password: hashedPassword,
            role: 'ACS',
            microAreaId: microArea01.id,
            isActive: true
        }
    });

    // ACS 2 - Microárea 02
    const acs2 = await prisma.users.create({
        data: {
            cpf: '55555555555',
            fullName: 'João Carlos Santos',
            email: 'joao.santos@saude360.com',
            password: hashedPassword,
            role: 'ACS',
            microAreaId: microArea02.id,
            isActive: true
        }
    });

    // ACS 3 - Microárea 03
    const acs3 = await prisma.users.create({
        data: {
            cpf: '66666666666',
            fullName: 'Francisca Pereira Lima',
            email: 'francisca.lima@saude360.com',
            password: hashedPassword,
            role: 'ACS',
            microAreaId: microArea03.id,
            isActive: true
        }
    });

    // ACS 4 - Microárea 04
    const acs4 = await prisma.users.create({
        data: {
            cpf: '77777777777',
            fullName: 'José Roberto Alves',
            email: 'jose.alves@saude360.com',
            password: hashedPassword,
            role: 'ACS',
            microAreaId: microArea04.id,
            isActive: true
        }
    });

    // ACS 5 - Microárea 05
    const acs5 = await prisma.users.create({
        data: {
            cpf: '88888888888',
            fullName: 'Antônia Costa Souza',
            email: 'antonia.souza@saude360.com',
            password: hashedPassword,
            role: 'ACS',
            microAreaId: microArea05.id,
            isActive: true
        }
    });

    console.log('✅ Usuários criados!');

    // Criar Pacientes
    console.log('🏥 Criando pacientes...');

    const microAreas = [microArea01, microArea02, microArea03, microArea04, microArea05];
    const pacientesData = [
        // Microárea 01
        { nome: 'Pedro Henrique Souza', cpf: '10000000001', cns: '100000000010001', idade: 0, sexo: 'MALE', mae: 'Juliana Souza', microArea: 0, isChild: true },
        { nome: 'Carlos Pereira Lima', cpf: '10000000002', cns: '100000000010002', idade: 65, sexo: 'MALE', mae: 'Rosa Lima', microArea: 0, hasDiabetes: true, hasHypertension: true, isElderly: true },
        { nome: 'Maria Oliveira Costa', cpf: '10000000003', cns: '100000000010003', idade: 60, sexo: 'FEMALE', mae: 'Ana Costa', microArea: 0, hasDiabetes: true, isWoman: true },
        { nome: 'Fernanda Costa Alves', cpf: '10000000004', cns: '100000000010004', idade: 35, sexo: 'FEMALE', mae: 'Lucia Alves', microArea: 0, isWoman: true },
        { nome: 'José Antônio Ferreira', cpf: '10000000005', cns: '100000000010005', idade: 68, sexo: 'MALE', mae: 'Maria Ferreira', microArea: 0, isElderly: true },
        
        // Microárea 02
        { nome: 'Ana Clara Rodrigues', cpf: '20000000001', cns: '200000000010001', idade: 1, sexo: 'FEMALE', mae: 'Carla Rodrigues', microArea: 1, isChild: true },
        { nome: 'João Silva Santos', cpf: '20000000002', cns: '200000000010002', idade: 55, sexo: 'MALE', mae: 'Helena Santos', microArea: 1, hasHypertension: true },
        { nome: 'Mariana Souza Lima', cpf: '20000000003', cns: '200000000010003', idade: 28, sexo: 'FEMALE', mae: 'Paula Lima', microArea: 1, isPregnant: true, isWoman: true },
        { nome: 'Roberto Carlos Dias', cpf: '20000000004', cns: '200000000010004', idade: 72, sexo: 'MALE', mae: 'Joana Dias', microArea: 1, hasDiabetes: true, isElderly: true },
        { nome: 'Juliana Martins Rocha', cpf: '20000000005', cns: '200000000010005', idade: 42, sexo: 'FEMALE', mae: 'Sandra Rocha', microArea: 1, isWoman: true },
        
        // Microárea 03
        { nome: 'Lucas Gabriel Oliveira', cpf: '30000000001', cns: '300000000010001', idade: 0, sexo: 'MALE', mae: 'Beatriz Oliveira', microArea: 2, isChild: true },
        { nome: 'Antônio José Pereira', cpf: '30000000002', cns: '300000000010002', idade: 70, sexo: 'MALE', mae: 'Francisca Pereira', microArea: 2, hasHypertension: true, isElderly: true },
        { nome: 'Claudia Regina Santos', cpf: '30000000003', cns: '300000000010003', idade: 45, sexo: 'FEMALE', mae: 'Rita Santos', microArea: 2, isWoman: true },
        { nome: 'Paulo Henrique Costa', cpf: '30000000004', cns: '300000000010004', idade: 58, sexo: 'MALE', mae: 'Vera Costa', microArea: 2, hasDiabetes: true },
        { nome: 'Gabriela Ferreira Lima', cpf: '30000000005', cns: '300000000010005', idade: 32, sexo: 'FEMALE', mae: 'Lucia Lima', microArea: 2, isPregnant: true, isWoman: true },
        
        // Microárea 04
        { nome: 'Miguel Alves Souza', cpf: '40000000001', cns: '400000000010001', idade: 1, sexo: 'MALE', mae: 'Amanda Souza', microArea: 3, isChild: true },
        { nome: 'Francisco Silva Rocha', cpf: '40000000002', cns: '400000000010002', idade: 75, sexo: 'MALE', mae: 'Maria Rocha', microArea: 3, hasDiabetes: true, hasHypertension: true, isElderly: true },
        { nome: 'Patricia Oliveira Dias', cpf: '40000000003', cns: '400000000010003', idade: 38, sexo: 'FEMALE', mae: 'Joana Dias', microArea: 3, isWoman: true },
        { nome: 'Ricardo Mendes Lima', cpf: '40000000004', cns: '400000000010004', idade: 62, sexo: 'MALE', mae: 'Rosa Lima', microArea: 3, hasHypertension: true },
        { nome: 'Camila Santos Costa', cpf: '40000000005', cns: '400000000010005', idade: 25, sexo: 'FEMALE', mae: 'Ana Costa', microArea: 3, isPregnant: true, isWoman: true },
        
        // Microárea 05
        { nome: 'Sofia Rodrigues Alves', cpf: '50000000001', cns: '500000000010001', idade: 0, sexo: 'FEMALE', mae: 'Juliana Alves', microArea: 4, isChild: true },
        { nome: 'Manoel Pereira Santos', cpf: '50000000002', cns: '500000000010002', idade: 80, sexo: 'MALE', mae: 'Helena Santos', microArea: 4, isElderly: true },
        { nome: 'Renata Costa Ferreira', cpf: '50000000003', cns: '500000000010003', idade: 50, sexo: 'FEMALE', mae: 'Paula Ferreira', microArea: 4, hasDiabetes: true, isWoman: true },
        { nome: 'Eduardo Silva Rocha', cpf: '50000000004', cns: '500000000010004', idade: 48, sexo: 'MALE', mae: 'Sandra Rocha', microArea: 4, hasHypertension: true },
        { nome: 'Beatriz Martins Lima', cpf: '50000000005', cns: '500000000010005', idade: 29, sexo: 'FEMALE', mae: 'Carla Lima', microArea: 4, isPregnant: true, isWoman: true },
    ];

    for (const paciente of pacientesData) {
        const birthDate = new Date();
        birthDate.setFullYear(birthDate.getFullYear() - paciente.idade);
        
        const microArea = microAreas[paciente.microArea];
        
        const patient = await prisma.patients.create({
            data: {
                cpf: paciente.cpf,
                cns: paciente.cns,
                fullName: paciente.nome,
                motherName: paciente.mae,
                birthDate,
                sex: paciente.sexo as 'MALE' | 'FEMALE',
                street: 'Rua Principal',
                number: String(Math.floor(Math.random() * 1000) + 1),
                neighborhood: 'Centro',
                city: 'Cidade Exemplo',
                state: 'CE',
                microAreaId: microArea.id,
                primaryPhone: '(85) 99999-9999',
                isChild: paciente.isChild || false,
                isPregnant: paciente.isPregnant || false,
                hasDiabetes: paciente.hasDiabetes || false,
                hasHypertension: paciente.hasHypertension || false,
                isElderly: paciente.isElderly || false,
                isWoman: paciente.isWoman || false,
                createdById: admin.id
            }
        });

        // Criar indicadores para crianças
        if (paciente.isChild) {
            await prisma.childcare_indicators.create({
                data: {
                    patientId: patient.id,
                    b1Status: 'RED',
                    b2Status: 'RED',
                    b3Status: 'RED',
                    b4Status: 'RED',
                    vaccineStatus: 'NOT_STARTED',
                    b5Status: 'RED'
                }
            });
        }

        // Criar indicadores para diabéticos
        if (paciente.hasDiabetes) {
            await prisma.diabetes_indicators.create({
                data: {
                    patientId: patient.id,
                    d1Status: 'RED',
                    d2Status: 'RED',
                    d3Status: 'RED',
                    d4Status: 'RED',
                    d5Status: 'RED',
                    d6Status: 'RED'
                }
            });
        }

        // Criar indicadores para hipertensos
        if (paciente.hasHypertension) {
            await prisma.hypertension_indicators.create({
                data: {
                    patientId: patient.id,
                    e1Status: 'RED',
                    e2Status: 'RED',
                    e3Status: 'RED',
                    e4Status: 'RED'
                }
            });
        }

        // Criar indicadores para idosos
        if (paciente.isElderly) {
            await prisma.elderly_indicators.create({
                data: {
                    patientId: patient.id,
                    f1Status: 'RED',
                    f2Status: 'RED'
                }
            });
        }

        // Criar indicadores para mulheres
        if (paciente.isWoman && !paciente.isPregnant) {
            await prisma.woman_health_indicators.create({
                data: {
                    patientId: patient.id,
                    g1Status: 'RED',
                    g2Status: 'RED'
                }
            });
        }

        // Criar dados de pré-natal para gestantes
        if (paciente.isPregnant) {
            const lastMenstrualDate = new Date();
            lastMenstrualDate.setDate(lastMenstrualDate.getDate() - 60); // 60 dias atrás
            
            const expectedDeliveryDate = new Date(lastMenstrualDate);
            expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 280);
            
            const prenatalData = await prisma.prenatal_data.create({
                data: {
                    patientId: patient.id,
                    lastMenstrualDate,
                    expectedDeliveryDate,
                    gestationalAge: 8,
                    isHighRisk: false,
                    previousPregnancies: 0,
                    previousDeliveries: 0,
                    previousAbortions: 0
                }
            });

            await prisma.prenatal_indicators.create({
                data: {
                    prenatalDataId: prenatalData.id,
                    c1Status: 'RED',
                    c2Status: 'RED',
                    c3Status: 'RED',
                    c4Status: 'RED',
                    c5Status: 'RED',
                    c6Status: 'RED'
                }
            });
        }

        console.log(`  ✓ ${paciente.nome} - Microárea ${microArea.name}`);
    }

    console.log('✅ Pacientes criados!');
    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`  - 5 Microáreas`);
    console.log(`  - 9 Usuários (1 Admin, 1 Médico, 1 Enfermeiro, 1 Téc. Enfermagem, 5 ACS)`);
    console.log(`  - 25 Pacientes (5 por microárea)`);
    console.log('\n🔑 Credenciais de acesso:');
    console.log(`  Admin: CPF 00000000000 / Senha: senha123`);
    console.log(`  Médico: CPF 11111111111 / Senha: senha123`);
    console.log(`  Enfermeiro: CPF 22222222222 / Senha: senha123`);
    console.log(`  Téc. Enfermagem: CPF 33333333333 / Senha: senha123`);
    console.log(`  ACS 1 (MA-01): CPF 44444444444 / Senha: senha123`);
    console.log(`  ACS 2 (MA-02): CPF 55555555555 / Senha: senha123`);
    console.log(`  ACS 3 (MA-03): CPF 66666666666 / Senha: senha123`);
    console.log(`  ACS 4 (MA-04): CPF 77777777777 / Senha: senha123`);
    console.log(`  ACS 5 (MA-05): CPF 88888888888 / Senha: senha123`);
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
