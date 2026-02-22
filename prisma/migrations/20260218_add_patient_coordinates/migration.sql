-- AlterTable
ALTER TABLE "patients" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "patients" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "patients" ADD COLUMN "geocodedAt" TIMESTAMP(3);

