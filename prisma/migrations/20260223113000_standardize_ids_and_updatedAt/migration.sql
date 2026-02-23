-- Extensão para UUID no PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Padroniza default de id em todos os models principais
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'appointments',
    'audit_logs',
    'childcare_consultations',
    'childcare_indicators',
    'diabetes_consultations',
    'diabetes_indicators',
    'elderly_consultations',
    'elderly_indicators',
    'home_visits',
    'hypertension_consultations',
    'hypertension_indicators',
    'micro_areas',
    'patients',
    'postpartum_consultations',
    'prenatal_consultations',
    'prenatal_data',
    'prenatal_exams',
    'prenatal_indicators',
    'users',
    'vaccine_records',
    'vaccines',
    'woman_exams',
    'woman_health_indicators',
    'notifications',
    'anthropometry',
    'blood_pressure',
    'glucose_measurement'
  ] LOOP
    EXECUTE format('ALTER TABLE "%s" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();', t);
  END LOOP;
END $$;

-- Padroniza defaults de updatedAt para compatibilidade com deploy gradual
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'appointments',
    'childcare_consultations',
    'diabetes_consultations',
    'elderly_consultations',
    'home_visits',
    'hypertension_consultations',
    'micro_areas',
    'patients',
    'postpartum_consultations',
    'prenatal_consultations',
    'prenatal_data',
    'prenatal_exams',
    'users',
    'vaccine_records',
    'vaccines',
    'woman_exams',
    'lab_exam_requests',
    'lab_exams',
    'anthropometry',
    'blood_pressure',
    'glucose_measurement'
  ] LOOP
    EXECUTE format('ALTER TABLE "%s" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;', t);
  END LOOP;
END $$;

-- Padroniza defaults de lastUpdated para modelos de indicadores
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'childcare_indicators',
    'diabetes_indicators',
    'elderly_indicators',
    'hypertension_indicators',
    'prenatal_indicators',
    'woman_health_indicators'
  ] LOOP
    EXECUTE format('ALTER TABLE "%s" ALTER COLUMN "lastUpdated" SET DEFAULT CURRENT_TIMESTAMP;', t);
  END LOOP;
END $$;
