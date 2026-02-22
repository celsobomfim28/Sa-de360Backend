-- Limpar dados existentes
TRUNCATE TABLE vaccine_records, appointments, home_visits, childcare_indicators, diabetes_indicators, hypertension_indicators, elderly_indicators, woman_health_indicators, prenatal_indicators, prenatal_consultations, prenatal_data, patients, users, micro_areas CASCADE;

-- Criar Microáreas
INSERT INTO micro_areas (id, name, code, description, "createdAt", "updatedAt") VALUES
('c8c0aa3d-14ce-4a12-98c6-d592c6a0f557', '01', 'MA-01', 'Microárea 01 - Centro', NOW(), NOW()),
('7786bffd-f3ae-4a77-931f-7ec781a2cb48', '02', 'MA-02', 'Microárea 02 - Bairro Norte', NOW(), NOW()),
(gen_random_uuid(), '03', 'MA-03', 'Microárea 03 - Bairro Sul', NOW(), NOW()),
(gen_random_uuid(), '04', 'MA-04', 'Microárea 04 - Bairro Leste', NOW(), NOW()),
(gen_random_uuid(), '05', 'MA-05', 'Microárea 05 - Bairro Oeste', NOW(), NOW());

-- Criar Usuários (senha: senha123 - hash bcrypt)
INSERT INTO users (id, cpf, "fullName", email, password, role, "isActive", "createdAt", "updatedAt") VALUES
('4f9b2236-cfea-428b-9a0b-3f10a541df91', '00000000000', 'Administrador do Sistema', 'admin@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ADMIN', true, NOW(), NOW()),
(gen_random_uuid(), '11111111111', 'Dr. Roberto Mendes', 'roberto.mendes@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'MEDICO', true, NOW(), NOW()),
(gen_random_uuid(), '22222222222', 'Enf. Ana Paula Oliveira', 'ana.oliveira@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ENFERMEIRO', true, NOW(), NOW()),
(gen_random_uuid(), '33333333333', 'Téc. Carla Fernandes', 'carla.fernandes@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'TECNICO_ENFERMAGEM', true, NOW(), NOW()),
(gen_random_uuid(), '44444444444', 'Maria das Graças Silva', 'maria.silva@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ACS', true, NOW(), NOW()),
(gen_random_uuid(), '55555555555', 'João Carlos Santos', 'joao.santos@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ACS', true, NOW(), NOW()),
(gen_random_uuid(), '66666666666', 'Francisca Pereira Lima', 'francisca.lima@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ACS', true, NOW(), NOW()),
(gen_random_uuid(), '77777777777', 'José Roberto Alves', 'jose.alves@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ACS', true, NOW(), NOW()),
(gen_random_uuid(), '88888888888', 'Antônia Costa Souza', 'antonia.souza@saude360.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lk7QfGqZqK7e', 'ACS', true, NOW(), NOW());

-- Atualizar microAreaId dos ACS
UPDATE users SET "microAreaId" = (SELECT id FROM micro_areas WHERE code = 'MA-01') WHERE cpf = '44444444444';
UPDATE users SET "microAreaId" = (SELECT id FROM micro_areas WHERE code = 'MA-02') WHERE cpf = '55555555555';
UPDATE users SET "microAreaId" = (SELECT id FROM micro_areas WHERE code = 'MA-03') WHERE cpf = '66666666666';
UPDATE users SET "microAreaId" = (SELECT id FROM micro_areas WHERE code = 'MA-04') WHERE cpf = '77777777777';
UPDATE users SET "microAreaId" = (SELECT id FROM micro_areas WHERE code = 'MA-05') WHERE cpf = '88888888888';

-- Criar Pacientes para Microárea 01
DO $$
DECLARE
    ma01_id uuid := (SELECT id FROM micro_areas WHERE code = 'MA-01');
    admin_id uuid := (SELECT id FROM users WHERE cpf = '00000000000');
    patient_id uuid;
BEGIN
    -- Criança
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isChild", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '10000000001', '100000000010001', 'Pedro Henrique Souza', 'Juliana Souza', NOW() - INTERVAL '6 months', 'MALE', 'Rua Principal', '100', 'Centro', '60000-000', ma01_id, '(85) 99999-9999', true, admin_id, NOW(), NOW());
    INSERT INTO childcare_indicators (id, "patientId", "b1Status", "b2Status", "b3Status", "b4Status", "vaccineStatus", "b5Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'NOT_STARTED', 'RED', NOW());

    -- Diabético e Hipertenso Idoso
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "hasDiabetes", "hasHypertension", "isElderly", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '10000000002', '100000000010002', 'Carlos Pereira Lima', 'Rosa Lima', NOW() - INTERVAL '65 years', 'MALE', 'Rua Principal', '101', 'Centro', '60000-000', ma01_id, '(85) 99999-9998', true, true, true, admin_id, NOW(), NOW());
    INSERT INTO diabetes_indicators (id, "patientId", "d1Status", "d2Status", "d3Status", "d4Status", "d5Status", "d6Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'RED', 'RED', NOW());
    INSERT INTO hypertension_indicators (id, "patientId", "e1Status", "e2Status", "e3Status", "e4Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', NOW());
    INSERT INTO elderly_indicators (id, "patientId", "f1Status", "f2Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());

    -- Diabética Mulher
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "hasDiabetes", "isWoman", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '10000000003', '100000000010003', 'Maria Oliveira Costa', 'Ana Costa', NOW() - INTERVAL '60 years', 'FEMALE', 'Rua Principal', '102', 'Centro', '60000-000', ma01_id, '(85) 99999-9997', true, true, admin_id, NOW(), NOW());
    INSERT INTO diabetes_indicators (id, "patientId", "d1Status", "d2Status", "d3Status", "d4Status", "d5Status", "d6Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'RED', 'RED', NOW());

    -- Mulher
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isWoman", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '10000000004', '100000000010004', 'Fernanda Costa Alves', 'Lucia Alves', NOW() - INTERVAL '35 years', 'FEMALE', 'Rua Principal', '103', 'Centro', '60000-000', ma01_id, '(85) 99999-9996', true, admin_id, NOW(), NOW());
    INSERT INTO woman_health_indicators (id, "patientId", "g1Status", "g2Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());

    -- Idoso
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isElderly", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '10000000005', '100000000010005', 'José Antônio Ferreira', 'Maria Ferreira', NOW() - INTERVAL '68 years', 'MALE', 'Rua Principal', '104', 'Centro', '60000-000', ma01_id, '(85) 99999-9995', true, admin_id, NOW(), NOW());
    INSERT INTO elderly_indicators (id, "patientId", "f1Status", "f2Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());
END $$;

-- Criar Pacientes para Microárea 02
DO $$
DECLARE
    ma02_id uuid := (SELECT id FROM micro_areas WHERE code = 'MA-02');
    admin_id uuid := (SELECT id FROM users WHERE cpf = '00000000000');
    patient_id uuid;
    prenatal_id uuid;
BEGIN
    -- Criança
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isChild", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '20000000001', '200000000010001', 'Ana Clara Rodrigues', 'Carla Rodrigues', NOW() - INTERVAL '1 year', 'FEMALE', 'Rua Norte', '200', 'Bairro Norte', '60000-000', ma02_id, '(85) 98888-8888', true, admin_id, NOW(), NOW());
    INSERT INTO childcare_indicators (id, "patientId", "b1Status", "b2Status", "b3Status", "b4Status", "vaccineStatus", "b5Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'NOT_STARTED', 'RED', NOW());

    -- Hipertenso
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "hasHypertension", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '20000000002', '200000000010002', 'João Silva Santos', 'Helena Santos', NOW() - INTERVAL '55 years', 'MALE', 'Rua Norte', '201', 'Bairro Norte', '60000-000', ma02_id, '(85) 98888-8887', true, admin_id, NOW(), NOW());
    INSERT INTO hypertension_indicators (id, "patientId", "e1Status", "e2Status", "e3Status", "e4Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', NOW());

    -- Gestante
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isPregnant", "isWoman", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '20000000003', '200000000010003', 'Mariana Souza Lima', 'Paula Lima', NOW() - INTERVAL '28 years', 'FEMALE', 'Rua Norte', '202', 'Bairro Norte', '60000-000', ma02_id, '(85) 98888-8886', true, true, admin_id, NOW(), NOW());
    prenatal_id := gen_random_uuid();
    INSERT INTO prenatal_data (id, "patientId", "lastMenstrualDate", "expectedDeliveryDate", "gestationalAge", "isHighRisk", "previousPregnancies", "previousDeliveries", "previousAbortions", "updatedAt")
    VALUES (prenatal_id, patient_id, NOW() - INTERVAL '60 days', NOW() + INTERVAL '220 days', 8, false, 0, 0, 0, NOW());
    INSERT INTO prenatal_indicators (id, "prenatalDataId", "c1Status", "c2Status", "c3Status", "c4Status", "c5Status", "c6Status", "lastUpdated")
    VALUES (gen_random_uuid(), prenatal_id, 'RED', 'RED', 'RED', 'RED', 'RED', 'RED', NOW());

    -- Diabético Idoso
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "hasDiabetes", "isElderly", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '20000000004', '200000000010004', 'Roberto Carlos Dias', 'Joana Dias', NOW() - INTERVAL '72 years', 'MALE', 'Rua Norte', '203', 'Bairro Norte', '60000-000', ma02_id, '(85) 98888-8885', true, true, admin_id, NOW(), NOW());
    INSERT INTO diabetes_indicators (id, "patientId", "d1Status", "d2Status", "d3Status", "d4Status", "d5Status", "d6Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'RED', 'RED', NOW());
    INSERT INTO elderly_indicators (id, "patientId", "f1Status", "f2Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());

    -- Mulher
    patient_id := gen_random_uuid();
    INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isWoman", "createdById", "createdAt", "updatedAt")
    VALUES (patient_id, '20000000005', '200000000010005', 'Juliana Martins Rocha', 'Sandra Rocha', NOW() - INTERVAL '42 years', 'FEMALE', 'Rua Norte', '204', 'Bairro Norte', '60000-000', ma02_id, '(85) 98888-8884', true, admin_id, NOW(), NOW());
    INSERT INTO woman_health_indicators (id, "patientId", "g1Status", "g2Status", "lastUpdated") 
    VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());
END $$;

-- Criar mais 3 pacientes para cada microárea (03, 04, 05)
DO $$
DECLARE
    ma_id uuid;
    admin_id uuid := (SELECT id FROM users WHERE cpf = '00000000000');
    patient_id uuid;
    counter int;
BEGIN
    FOR counter IN 3..5 LOOP
        ma_id := (SELECT id FROM micro_areas WHERE code = 'MA-0' || counter);
        
        -- Paciente 1
        patient_id := gen_random_uuid();
        INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isChild", "createdById", "createdAt", "updatedAt")
        VALUES (patient_id, counter || '0000000001', counter || '00000000010001', 'Paciente Criança ' || counter, 'Mãe ' || counter, NOW() - INTERVAL '8 months', 'MALE', 'Rua ' || counter, '100', 'Bairro ' || counter, '60000-000', ma_id, '(85) 9' || counter || counter || counter || counter || '-' || counter || counter || counter || counter, true, admin_id, NOW(), NOW());
        INSERT INTO childcare_indicators (id, "patientId", "b1Status", "b2Status", "b3Status", "b4Status", "vaccineStatus", "b5Status", "lastUpdated") 
        VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'NOT_STARTED', 'RED', NOW());
        
        -- Paciente 2
        patient_id := gen_random_uuid();
        INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "hasDiabetes", "createdById", "createdAt", "updatedAt")
        VALUES (patient_id, counter || '0000000002', counter || '00000000010002', 'Paciente Diabético ' || counter, 'Mãe ' || counter, NOW() - INTERVAL '50 years', 'MALE', 'Rua ' || counter, '101', 'Bairro ' || counter, '60000-000', ma_id, '(85) 9' || counter || counter || counter || counter || '-' || counter || counter || counter || (counter+1), true, admin_id, NOW(), NOW());
        INSERT INTO diabetes_indicators (id, "patientId", "d1Status", "d2Status", "d3Status", "d4Status", "d5Status", "d6Status", "lastUpdated") 
        VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', 'RED', 'RED', NOW());
        
        -- Paciente 3
        patient_id := gen_random_uuid();
        INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "hasHypertension", "createdById", "createdAt", "updatedAt")
        VALUES (patient_id, counter || '0000000003', counter || '00000000010003', 'Paciente Hipertenso ' || counter, 'Mãe ' || counter, NOW() - INTERVAL '60 years', 'FEMALE', 'Rua ' || counter, '102', 'Bairro ' || counter, '60000-000', ma_id, '(85) 9' || counter || counter || counter || counter || '-' || counter || counter || counter || (counter+2), true, admin_id, NOW(), NOW());
        INSERT INTO hypertension_indicators (id, "patientId", "e1Status", "e2Status", "e3Status", "e4Status", "lastUpdated") 
        VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', 'RED', 'RED', NOW());
        
        -- Paciente 4
        patient_id := gen_random_uuid();
        INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isElderly", "createdById", "createdAt", "updatedAt")
        VALUES (patient_id, counter || '0000000004', counter || '00000000010004', 'Paciente Idoso ' || counter, 'Mãe ' || counter, NOW() - INTERVAL '70 years', 'MALE', 'Rua ' || counter, '103', 'Bairro ' || counter, '60000-000', ma_id, '(85) 9' || counter || counter || counter || counter || '-' || counter || counter || counter || (counter+3), true, admin_id, NOW(), NOW());
        INSERT INTO elderly_indicators (id, "patientId", "f1Status", "f2Status", "lastUpdated") 
        VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());
        
        -- Paciente 5
        patient_id := gen_random_uuid();
        INSERT INTO patients (id, cpf, cns, "fullName", "motherName", "birthDate", sex, street, number, neighborhood, "zipCode", "microAreaId", "primaryPhone", "isWoman", "createdById", "createdAt", "updatedAt")
        VALUES (patient_id, counter || '0000000005', counter || '00000000010005', 'Paciente Mulher ' || counter, 'Mãe ' || counter, NOW() - INTERVAL '40 years', 'FEMALE', 'Rua ' || counter, '104', 'Bairro ' || counter, '60000-000', ma_id, '(85) 9' || counter || counter || counter || counter || '-' || counter || counter || counter || (counter+4), true, admin_id, NOW(), NOW());
        INSERT INTO woman_health_indicators (id, "patientId", "g1Status", "g2Status", "lastUpdated") 
        VALUES (gen_random_uuid(), patient_id, 'RED', 'RED', NOW());
    END LOOP;
END $$;

-- Mensagem de sucesso
SELECT 'Seed executado com sucesso!' as mensagem;
SELECT 'Microáreas: ' || COUNT(*)::text FROM micro_areas;
SELECT 'Usuários: ' || COUNT(*)::text FROM users;
SELECT 'Pacientes: ' || COUNT(*)::text FROM patients;
