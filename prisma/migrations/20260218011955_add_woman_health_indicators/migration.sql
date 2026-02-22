-- AlterTable
ALTER TABLE "woman_health_indicators" ADD COLUMN     "bStatus" "IndicatorStatus" NOT NULL DEFAULT 'RED',
ADD COLUMN     "cStatus" "IndicatorStatus" NOT NULL DEFAULT 'RED',
ADD COLUMN     "lastHpvVaccineDate" TIMESTAMP(3),
ADD COLUMN     "lastSexualHealthConsultationDate" TIMESTAMP(3);
