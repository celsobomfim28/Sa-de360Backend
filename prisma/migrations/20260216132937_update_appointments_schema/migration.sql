-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'ABSENT', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('PRENATAL', 'CHILDCARE', 'HYPERTENSION', 'DIABETES', 'ROUTINE', 'POSTPARTUM', 'ELDERLY_CARE', 'WOMAN_HEALTH', 'MEDICAL', 'NURSING', 'DENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BreastfeedingStatus" AS ENUM ('YES', 'NO', 'WITH_DIFFICULTIES');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('VAGINAL', 'CESAREAN');

-- CreateEnum
CREATE TYPE "FeedingType" AS ENUM ('EXCLUSIVE_BREASTFEEDING', 'COMPLEMENTARY_FEEDING', 'ARTIFICIAL_FEEDING', 'MIXED_FEEDING');

-- CreateEnum
CREATE TYPE "GlucoseType" AS ENUM ('FASTING', 'POSTPRANDIAL', 'CASUAL');

-- CreateEnum
CREATE TYPE "HomeVisitType" AS ENUM ('NEWBORN_VD1', 'NEWBORN_VD2', 'PREGNANT_VD1', 'PREGNANT_VD2', 'PREGNANT_VD3', 'POSTPARTUM_VD', 'ACTIVE_SEARCH', 'ROUTINE');

-- CreateEnum
CREATE TYPE "IndicatorStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "InvolutionStatus" AS ENUM ('ADEQUATE', 'INADEQUATE');

-- CreateEnum
CREATE TYPE "LochiaStatus" AS ENUM ('NORMAL', 'ALTERED');

-- CreateEnum
CREATE TYPE "PrenatalExamType" AS ENUM ('SYPHILIS_1ST_TRI', 'HIV_1ST_TRI', 'HEPATITIS_B_1ST_TRI', 'HEPATITIS_C_1ST_TRI', 'SYPHILIS_3RD_TRI', 'HIV_3RD_TRI');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ACS', 'TECNICO_ENFERMAGEM', 'ENFERMEIRO', 'MEDICO', 'ADMIN');

-- CreateEnum
CREATE TYPE "VaccineStatus" AS ENUM ('UP_TO_DATE', 'DELAYED', 'NOT_STARTED');

-- CreateEnum
CREATE TYPE "WomanExamType" AS ENUM ('PAP_SMEAR', 'MAMMOGRAPHY');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "reason" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "observations" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "absenceReason" TEXT,
    "absenceReportedById" TEXT,
    "absenceReportedAt" TIMESTAMP(3),
    "noticeGiven" BOOLEAN NOT NULL DEFAULT false,
    "noticeGivenAt" TIMESTAMP(3),
    "noticeGivenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "childcare_consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "headCircumference" DOUBLE PRECISION,
    "developmentMilestones" JSONB NOT NULL,
    "feedingType" "FeedingType" NOT NULL,
    "feedingObservations" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "childcare_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "childcare_indicators" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "firstConsultationDate" TIMESTAMP(3),
    "b1Status" "IndicatorStatus" NOT NULL,
    "consultationCount" INTEGER NOT NULL DEFAULT 0,
    "b2Status" "IndicatorStatus" NOT NULL,
    "anthropometryCount" INTEGER NOT NULL DEFAULT 0,
    "b3Status" "IndicatorStatus" NOT NULL,
    "vd1Date" TIMESTAMP(3),
    "vd2Date" TIMESTAMP(3),
    "b4Status" "IndicatorStatus" NOT NULL,
    "vaccineStatus" "VaccineStatus" NOT NULL,
    "b5Status" "IndicatorStatus" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "childcare_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diabetes_consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "glucose" DOUBLE PRECISION,
    "glucoseType" "GlucoseType",
    "hba1c" DOUBLE PRECISION,
    "footExamPerformed" BOOLEAN NOT NULL DEFAULT false,
    "footExamResult" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "medicationAdherence" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diabetes_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diabetes_indicators" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "lastConsultationDate" TIMESTAMP(3),
    "d1Status" "IndicatorStatus" NOT NULL,
    "lastBloodPressureDate" TIMESTAMP(3),
    "d2Status" "IndicatorStatus" NOT NULL,
    "lastAnthropometryDate" TIMESTAMP(3),
    "d3Status" "IndicatorStatus" NOT NULL,
    "visitCountLast12Months" INTEGER NOT NULL DEFAULT 0,
    "d4Status" "IndicatorStatus" NOT NULL,
    "lastHba1cDate" TIMESTAMP(3),
    "d5Status" "IndicatorStatus" NOT NULL,
    "lastFootExamDate" TIMESTAMP(3),
    "d6Status" "IndicatorStatus" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diabetes_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elderly_consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "ivcfScore" INTEGER,
    "isVulnerable" BOOLEAN NOT NULL DEFAULT false,
    "medicationsCount" INTEGER NOT NULL DEFAULT 0,
    "medicationsList" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elderly_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elderly_indicators" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hasPolypharmacy" BOOLEAN NOT NULL DEFAULT false,
    "polypharmacyUpdatedDate" TIMESTAMP(3),
    "f1Status" "IndicatorStatus" NOT NULL,
    "lastIvcfDate" TIMESTAMP(3),
    "ivcfScore" INTEGER,
    "f2Status" "IndicatorStatus" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elderly_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_visits" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "acsId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "visitType" "HomeVisitType" NOT NULL,
    "purpose" TEXT NOT NULL,
    "observations" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hypertension_consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "systolicBP" INTEGER NOT NULL,
    "diastolicBP" INTEGER NOT NULL,
    "heartRate" INTEGER,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "medicationAdherence" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hypertension_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hypertension_indicators" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "lastConsultationDate" TIMESTAMP(3),
    "e1Status" "IndicatorStatus" NOT NULL,
    "lastBloodPressureDate" TIMESTAMP(3),
    "e2Status" "IndicatorStatus" NOT NULL,
    "lastAnthropometryDate" TIMESTAMP(3),
    "e3Status" "IndicatorStatus" NOT NULL,
    "visitCountLast12Months" INTEGER NOT NULL DEFAULT 0,
    "e4Status" "IndicatorStatus" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hypertension_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cns" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "motherName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "referencePoint" TEXT,
    "microAreaId" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "email" TEXT,
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "isPostpartum" BOOLEAN NOT NULL DEFAULT false,
    "hasHypertension" BOOLEAN NOT NULL DEFAULT false,
    "hypertensionDiagnosisDate" TIMESTAMP(3),
    "hasDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "diabetesDiagnosisDate" TIMESTAMP(3),
    "isElderly" BOOLEAN NOT NULL DEFAULT false,
    "isWoman" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postpartum_consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bloodPressure" TEXT NOT NULL,
    "uterineInvolution" "InvolutionStatus" NOT NULL,
    "lochia" "LochiaStatus" NOT NULL,
    "breastfeeding" "BreastfeedingStatus" NOT NULL,
    "contraceptiveMethod" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postpartum_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prenatal_consultations" (
    "id" TEXT NOT NULL,
    "prenatalDataId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "gestationalAge" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION,
    "bloodPressure" TEXT NOT NULL,
    "uterineHeight" DOUBLE PRECISION,
    "fetalHeartRate" INTEGER,
    "edema" BOOLEAN NOT NULL DEFAULT false,
    "complaints" TEXT,
    "conduct" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prenatal_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prenatal_data" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "lastMenstrualDate" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3) NOT NULL,
    "gestationalAge" INTEGER NOT NULL,
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "previousPregnancies" INTEGER NOT NULL,
    "previousDeliveries" INTEGER NOT NULL,
    "previousAbortions" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "deliveryType" "DeliveryType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prenatal_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prenatal_exams" (
    "id" TEXT NOT NULL,
    "prenatalDataId" TEXT NOT NULL,
    "examType" "PrenatalExamType" NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "resultDate" TIMESTAMP(3),
    "result" TEXT,
    "evaluated" BOOLEAN NOT NULL DEFAULT false,
    "evaluatedById" TEXT,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prenatal_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prenatal_indicators" (
    "id" TEXT NOT NULL,
    "prenatalDataId" TEXT NOT NULL,
    "prenatalConsultationCount" INTEGER NOT NULL DEFAULT 0,
    "postpartumConsultationDone" BOOLEAN NOT NULL DEFAULT false,
    "c1Status" "IndicatorStatus" NOT NULL,
    "bloodPressureCount" INTEGER NOT NULL DEFAULT 0,
    "c2Status" "IndicatorStatus" NOT NULL,
    "weightHeightRecorded" BOOLEAN NOT NULL DEFAULT false,
    "c3Status" "IndicatorStatus" NOT NULL,
    "vd1Date" TIMESTAMP(3),
    "vd2Date" TIMESTAMP(3),
    "vd3Date" TIMESTAMP(3),
    "vdPostpartumDate" TIMESTAMP(3),
    "c4Status" "IndicatorStatus" NOT NULL,
    "dtpaVaccineDate" TIMESTAMP(3),
    "c5Status" "IndicatorStatus" NOT NULL,
    "exams1stTriCompleted" BOOLEAN NOT NULL DEFAULT false,
    "exams3rdTriCompleted" BOOLEAN NOT NULL DEFAULT false,
    "c6Status" "IndicatorStatus" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prenatal_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "microAreaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "vaccineId" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "dose" INTEGER NOT NULL,
    "batchNumber" TEXT,
    "appliedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ageSchedule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "woman_exams" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "WomanExamType" NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "result" TEXT,
    "observations" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "woman_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "woman_health_indicators" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "lastPapSmearDate" TIMESTAMP(3),
    "g1Status" "IndicatorStatus" NOT NULL,
    "lastMammographyDate" TIMESTAMP(3),
    "g2Status" "IndicatorStatus" NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "woman_health_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "childcare_indicators_patientId_key" ON "childcare_indicators"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "diabetes_indicators_patientId_key" ON "diabetes_indicators"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "elderly_indicators_patientId_key" ON "elderly_indicators"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "hypertension_indicators_patientId_key" ON "hypertension_indicators"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "micro_areas_code_key" ON "micro_areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cns_key" ON "patients"("cns");

-- CreateIndex
CREATE UNIQUE INDEX "prenatal_data_patientId_key" ON "prenatal_data"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "prenatal_indicators_prenatalDataId_key" ON "prenatal_indicators"("prenatalDataId");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vaccines_name_key" ON "vaccines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "woman_health_indicators_patientId_key" ON "woman_health_indicators"("patientId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_absenceReportedById_fkey" FOREIGN KEY ("absenceReportedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_noticeGivenById_fkey" FOREIGN KEY ("noticeGivenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "childcare_consultations" ADD CONSTRAINT "childcare_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "childcare_consultations" ADD CONSTRAINT "childcare_consultations_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "childcare_indicators" ADD CONSTRAINT "childcare_indicators_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diabetes_consultations" ADD CONSTRAINT "diabetes_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diabetes_consultations" ADD CONSTRAINT "diabetes_consultations_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diabetes_indicators" ADD CONSTRAINT "diabetes_indicators_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elderly_consultations" ADD CONSTRAINT "elderly_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elderly_consultations" ADD CONSTRAINT "elderly_consultations_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elderly_indicators" ADD CONSTRAINT "elderly_indicators_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_acsId_fkey" FOREIGN KEY ("acsId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hypertension_consultations" ADD CONSTRAINT "hypertension_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hypertension_consultations" ADD CONSTRAINT "hypertension_consultations_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hypertension_indicators" ADD CONSTRAINT "hypertension_indicators_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_microAreaId_fkey" FOREIGN KEY ("microAreaId") REFERENCES "micro_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postpartum_consultations" ADD CONSTRAINT "postpartum_consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postpartum_consultations" ADD CONSTRAINT "postpartum_consultations_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_consultations" ADD CONSTRAINT "prenatal_consultations_prenatalDataId_fkey" FOREIGN KEY ("prenatalDataId") REFERENCES "prenatal_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_consultations" ADD CONSTRAINT "prenatal_consultations_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_data" ADD CONSTRAINT "prenatal_data_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_exams" ADD CONSTRAINT "prenatal_exams_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_exams" ADD CONSTRAINT "prenatal_exams_prenatalDataId_fkey" FOREIGN KEY ("prenatalDataId") REFERENCES "prenatal_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prenatal_indicators" ADD CONSTRAINT "prenatal_indicators_prenatalDataId_fkey" FOREIGN KEY ("prenatalDataId") REFERENCES "prenatal_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_microAreaId_fkey" FOREIGN KEY ("microAreaId") REFERENCES "micro_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_records" ADD CONSTRAINT "vaccine_records_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_records" ADD CONSTRAINT "vaccine_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_records" ADD CONSTRAINT "vaccine_records_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "vaccines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "woman_exams" ADD CONSTRAINT "woman_exams_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "woman_exams" ADD CONSTRAINT "woman_exams_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "woman_health_indicators" ADD CONSTRAINT "woman_health_indicators_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
