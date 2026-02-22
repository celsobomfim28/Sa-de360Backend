-- CreateTable
CREATE TABLE "anthropometry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anthropometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood_pressure" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "systolicBP" INTEGER NOT NULL,
    "diastolicBP" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood_pressure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glucose_measurement" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "glucose" DOUBLE PRECISION NOT NULL,
    "glucoseType" "GlucoseType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glucose_measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anthropometry_patientId_measurementDate_idx" ON "anthropometry"("patientId", "measurementDate");

-- CreateIndex
CREATE INDEX "blood_pressure_patientId_measurementDate_idx" ON "blood_pressure"("patientId", "measurementDate");

-- CreateIndex
CREATE INDEX "glucose_measurement_patientId_measurementDate_idx" ON "glucose_measurement"("patientId", "measurementDate");

-- AddForeignKey
ALTER TABLE "anthropometry" ADD CONSTRAINT "anthropometry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anthropometry" ADD CONSTRAINT "anthropometry_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_pressure" ADD CONSTRAINT "blood_pressure_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood_pressure" ADD CONSTRAINT "blood_pressure_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucose_measurement" ADD CONSTRAINT "glucose_measurement_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucose_measurement" ADD CONSTRAINT "glucose_measurement_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
