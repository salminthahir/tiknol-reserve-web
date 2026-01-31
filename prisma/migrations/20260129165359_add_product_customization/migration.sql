-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customizationOptions" JSONB,
ADD COLUMN     "hasCustomization" BOOLEAN NOT NULL DEFAULT false;
