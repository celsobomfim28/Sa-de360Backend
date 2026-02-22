-- Atualizar nomes dos pacientes das microáreas 03, 04 e 05

-- Microárea 03
UPDATE patients SET "fullName" = 'Lucas Gabriel Martins', "motherName" = 'Beatriz Martins' 
WHERE cpf = '30000000001';

UPDATE patients SET "fullName" = 'Sebastião Alves Costa', "motherName" = 'Rosa Costa' 
WHERE cpf = '30000000002';

UPDATE patients SET "fullName" = 'Conceição Silva Oliveira', "motherName" = 'Maria Oliveira' 
WHERE cpf = '30000000003';

UPDATE patients SET "fullName" = 'Francisco das Chagas Lima', "motherName" = 'Antônia Lima' 
WHERE cpf = '30000000004';

UPDATE patients SET "fullName" = 'Adriana Souza Pereira', "motherName" = 'Joana Pereira' 
WHERE cpf = '30000000005';

-- Microárea 04
UPDATE patients SET "fullName" = 'Sofia Vitória Santos', "motherName" = 'Camila Santos' 
WHERE cpf = '40000000001';

UPDATE patients SET "fullName" = 'Raimundo Nonato Silva', "motherName" = 'Francisca Silva' 
WHERE cpf = '40000000002';

UPDATE patients SET "fullName" = 'Terezinha Rodrigues Alves', "motherName" = 'Socorro Alves' 
WHERE cpf = '40000000003';

UPDATE patients SET "fullName" = 'Manoel Messias Ferreira', "motherName" = 'Luzia Ferreira' 
WHERE cpf = '40000000004';

UPDATE patients SET "fullName" = 'Luciana Cristina Rocha', "motherName" = 'Vera Rocha' 
WHERE cpf = '40000000005';

-- Microárea 05
UPDATE patients SET "fullName" = 'Miguel Henrique Costa', "motherName" = 'Patrícia Costa' 
WHERE cpf = '50000000001';

UPDATE patients SET "fullName" = 'Antônio Carlos Bezerra', "motherName" = 'Raimunda Bezerra' 
WHERE cpf = '50000000002';

UPDATE patients SET "fullName" = 'Luzia Maria Gomes', "motherName" = 'Antônia Gomes' 
WHERE cpf = '50000000003';

UPDATE patients SET "fullName" = 'João Batista Araújo', "motherName" = 'Maria Araújo' 
WHERE cpf = '50000000004';

UPDATE patients SET "fullName" = 'Claudia Regina Mendes', "motherName" = 'Francisca Mendes' 
WHERE cpf = '50000000005';

-- Verificar atualizações
SELECT "fullName", cpf, "motherName", "microAreaId" 
FROM patients 
WHERE cpf LIKE '3%' OR cpf LIKE '4%' OR cpf LIKE '5%'
ORDER BY cpf;
