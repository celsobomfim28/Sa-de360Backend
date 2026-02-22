-- AlterTable
ALTER TABLE "elderly_indicators" ADD COLUMN     "aStatus" "IndicatorStatus" NOT NULL DEFAULT 'RED',
ADD COLUMN     "bStatus" "IndicatorStatus" NOT NULL DEFAULT 'RED',
ADD COLUMN     "lastAnthropometryDate" TIMESTAMP(3),
ADD COLUMN     "lastConsultationDate" TIMESTAMP(3);
