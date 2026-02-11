-- ============================================
-- Finalize Schema (Constraints)
-- Created: 2026-02-10
-- Purpose: Enforce NOT NULL and Foreign Keys AFTER data migration
-- ============================================

BEGIN;

-- 1. Enforce NOT NULL on branchId
ALTER TABLE "Order" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Employee" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Attendance" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Shift" ALTER COLUMN "branchId" SET NOT NULL;

-- 2. Add Foreign Keys
-- Note: Requires Branch table to exist and have the referenced IDs

ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ProductBranch FKs
ALTER TABLE "ProductBranch" ADD CONSTRAINT "ProductBranch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductBranch" ADD CONSTRAINT "ProductBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Cleanup
-- Drop deprecated columns if they exist
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "isAvailable"; -- Uncomment only if ready to drop

COMMIT;
