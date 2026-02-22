-- AlterTable
ALTER TABLE "elderly_indicators" ADD COLUMN     "c3Status" "IndicatorStatus" NOT NULL DEFAULT 'RED',
ADD COLUMN     "visitCountLast12Months" INTEGER NOT NULL DEFAULT 0;
