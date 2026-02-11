-- ============================================
-- Safe Schema Update (DDL)
-- Created: 2026-02-10
-- Purpose: Create tables and columns without data loss
-- ============================================

BEGIN;

-- 1. Create Branch Table
CREATE TABLE IF NOT EXISTS "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxRadius" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openingHours" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- Index for Branch code
CREATE UNIQUE INDEX IF NOT EXISTS "Branch_code_key" ON "Branch"("code");

-- 2. Create ProductBranch Table
CREATE TABLE IF NOT EXISTS "ProductBranch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "branchPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBranch_pkey" PRIMARY KEY ("id")
);

-- Indexes for ProductBranch
CREATE UNIQUE INDEX IF NOT EXISTS "ProductBranch_productId_branchId_key" ON "ProductBranch"("productId", "branchId");
CREATE INDEX IF NOT EXISTS "ProductBranch_branchId_isAvailable_idx" ON "ProductBranch"("branchId", "isAvailable");

-- 3. Add branchId columns (NULLABLE initially to allow data migration)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Shift" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

-- 4. Add applicableBranches to Voucher
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "applicableBranches" JSONB;

-- 5. Create Indexes for new columns
CREATE INDEX IF NOT EXISTS "Order_branchId_status_idx" ON "Order"("branchId", "status");
CREATE INDEX IF NOT EXISTS "Order_branchId_createdAt_idx" ON "Order"("branchId", "createdAt");
CREATE INDEX IF NOT EXISTS "Shift_branchId_status_idx" ON "Shift"("branchId", "status");
CREATE INDEX IF NOT EXISTS "Employee_branchId_role_idx" ON "Employee"("branchId", "role");
CREATE INDEX IF NOT EXISTS "Attendance_branchId_timestamp_idx" ON "Attendance"("branchId", "timestamp");
CREATE INDEX IF NOT EXISTS "Attendance_employeeId_timestamp_idx" ON "Attendance"("employeeId", "timestamp");

COMMIT;
