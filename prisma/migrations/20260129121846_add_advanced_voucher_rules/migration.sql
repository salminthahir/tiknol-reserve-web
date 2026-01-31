-- AlterTable
ALTER TABLE "Voucher" ADD COLUMN     "applicableCategories" JSONB,
ADD COLUMN     "happyHourEnd" TEXT,
ADD COLUMN     "happyHourStart" TEXT;
