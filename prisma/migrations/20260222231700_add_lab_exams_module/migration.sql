-- CreateEnum
CREATE TYPE "ExamPriority" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ExamRequestStatus" AS ENUM ('PENDING', 'COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamInterpretation" AS ENUM ('NORMAL', 'ALTERED', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LabExamType" AS ENUM (
  'HEMOGRAM',
  'HEMOGLOBIN',
  'HEMATOCRIT',
  'PLATELETS',
  'LEUKOCYTES',
  'GLUCOSE',
  'HBA1C',
  'TOTAL_CHOLESTEROL',
  'HDL_CHOLESTEROL',
  'LDL_CHOLESTEROL',
  'TRIGLYCERIDES',
  'UREA',
  'CREATININE',
  'URIC_ACID',
  'TGO_AST',
  'TGP_ALT',
  'BILIRUBIN',
  'ALKALINE_PHOSPHATASE',
  'TSH',
  'T4_FREE',
  'SYPHILIS_VDRL',
  'HIV',
  'HEPATITIS_B',
  'HEPATITIS_C',
  'TOXOPLASMOSIS',
  'RUBELLA',
  'URINALYSIS',
  'URINE_CULTURE',
  'STOOL_EXAM',
  'STOOL_CULTURE',
  'PSA',
  'PREGNANCY_TEST',
  'COVID_19',
  'OTHER'
);

-- CreateTable
CREATE TABLE "lab_exam_requests" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "priority" "ExamPriority" NOT NULL DEFAULT 'ROUTINE',
  "clinicalInfo" TEXT,
  "status" "ExamRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lab_exam_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_exams" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "examType" "LabExamType" NOT NULL,
  "collectionDate" TIMESTAMP(3),
  "collectedBy" TEXT,
  "resultDate" TIMESTAMP(3),
  "result" JSONB,
  "resultText" TEXT,
  "referenceRange" TEXT,
  "interpretation" "ExamInterpretation",
  "evaluated" BOOLEAN NOT NULL DEFAULT false,
  "evaluatedById" TEXT,
  "evaluatedAt" TIMESTAMP(3),
  "observations" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "lab_exams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_exam_requests_patientId_requestDate_idx" ON "lab_exam_requests"("patientId", "requestDate");

-- CreateIndex
CREATE INDEX "lab_exam_requests_status_idx" ON "lab_exam_requests"("status");

-- CreateIndex
CREATE INDEX "lab_exams_requestId_idx" ON "lab_exams"("requestId");

-- CreateIndex
CREATE INDEX "lab_exams_examType_idx" ON "lab_exams"("examType");

-- CreateIndex
CREATE INDEX "lab_exams_evaluated_resultDate_idx" ON "lab_exams"("evaluated", "resultDate");

-- AddForeignKey
ALTER TABLE "lab_exam_requests"
  ADD CONSTRAINT "lab_exam_requests_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_exam_requests"
  ADD CONSTRAINT "lab_exam_requests_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_exams"
  ADD CONSTRAINT "lab_exams_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "lab_exam_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_exams"
  ADD CONSTRAINT "lab_exams_evaluatedById_fkey"
  FOREIGN KEY ("evaluatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
