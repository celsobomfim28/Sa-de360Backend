-- AlterTable
ALTER TABLE "elderly_indicators" ADD COLUMN     "dStatus" "IndicatorStatus" NOT NULL DEFAULT 'RED',
ADD COLUMN     "lastInfluenzaVaccineDate" TIMESTAMP(3);
