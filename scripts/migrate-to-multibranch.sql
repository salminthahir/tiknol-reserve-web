-- ============================================
-- Multi-Branch Data Migration Script
-- Created: 2026-02-10
-- CRITICAL: Run this ONCE after schema migration
-- ============================================

-- Verify branch exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Branch" WHERE id = 'branch_head_office') THEN
    RAISE EXCEPTION 'Branch head_office not found! Run seed script first.';
  END IF;
END $$;

-- Start transaction
BEGIN;

-- ============================================
-- 1. MIGRATE ORDERS
-- ============================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE "Order" 
  SET "branchId" = 'branch_head_office' 
  WHERE "branchId" IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % orders to Head Office', updated_count;
END $$;

-- Verify no NULL branchId
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Order" WHERE "branchId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % orders still have NULL branchId', null_count;
  END IF;
  RAISE NOTICE '✅ All orders migrated successfully';
END $$;

-- ============================================
-- 2. MIGRATE EMPLOYEES
-- ============================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE "Employee" 
  SET "branchId" = 'branch_head_office' 
  WHERE "branchId" IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % employees to Head Office', updated_count;
END $$;

-- Verify
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Employee" WHERE "branchId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % employees still have NULL branchId', null_count;
  END IF;
  RAISE NOTICE '✅ All employees migrated successfully';
END $$;

-- ============================================
-- 3. MIGRATE ATTENDANCES
-- ============================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE "Attendance" 
  SET "branchId" = 'branch_head_office' 
  WHERE "branchId" IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % attendance records to Head Office', updated_count;
END $$;

-- Verify
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Attendance" WHERE "branchId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % attendances still have NULL branchId', null_count;
  END IF;
  RAISE NOTICE '✅ All attendances migrated successfully';
END $$;

-- ============================================
-- 4. MIGRATE SHIFTS
-- ============================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE "Shift" 
  SET "branchId" = 'branch_head_office' 
  WHERE "branchId" IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % shifts to Head Office', updated_count;
END $$;

-- Verify
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Shift" WHERE "branchId" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % shifts still have NULL branchId', null_count;
  END IF;
  RAISE NOTICE '✅ All shifts migrated successfully';
END $$;

-- ============================================
-- 5. MIGRATE PRODUCTS (Create ProductBranch)
-- ============================================
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Create ProductBranch for all existing products
  INSERT INTO "ProductBranch" ("id", "productId", "branchId", "isAvailable", "createdAt", "updatedAt")
  SELECT 
    gen_random_uuid()::text,
    p.id,
    'branch_head_office',
    COALESCE(p."isAvailable", true),  -- Use existing isAvailable or default to true
    NOW(),
    NOW()
  FROM "Product" p
  WHERE NOT EXISTS (
    SELECT 1 FROM "ProductBranch" pb 
    WHERE pb."productId" = p.id 
    AND pb."branchId" = 'branch_head_office'
  );
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Created % ProductBranch records', inserted_count;
END $$;

-- Verify all products have at least 1 branch
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM "Product" p
  WHERE NOT EXISTS (
    SELECT 1 FROM "ProductBranch" pb WHERE pb."productId" = p.id
  );
  
  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % products have no branch assignment', orphaned_count;
  END IF;
  RAISE NOTICE '✅ All products have branch assignments';
END $$;

-- ============================================
-- 6. FINAL SUMMARY
-- ============================================
DO $$
DECLARE
  summary TEXT;
BEGIN
  SELECT format(
    E'\n📊 MIGRATION SUMMARY:\n' ||
    '  Orders:      %s\n' ||
    '  Employees:   %s\n' ||
    '  Attendances: %s\n' ||
    '  Shifts:      %s\n' ||
    '  Products:    %s (via ProductBranch)\n',
    (SELECT COUNT(*) FROM "Order" WHERE "branchId" = 'branch_head_office'),
    (SELECT COUNT(*) FROM "Employee" WHERE "branchId" = 'branch_head_office'),
    (SELECT COUNT(*) FROM "Attendance" WHERE "branchId" = 'branch_head_office'),
    (SELECT COUNT(*) FROM "Shift" WHERE "branchId" = 'branch_head_office'),
    (SELECT COUNT(*) FROM "ProductBranch" WHERE "branchId" = 'branch_head_office')
  ) INTO summary;
  
  RAISE NOTICE '%', summary;
END $$;

-- Commit transaction
COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Multi-branch migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Verify data in Prisma Studio: npx prisma studio';
  RAISE NOTICE '2. Regenerate Prisma Client: npx prisma generate';
  RAISE NOTICE '3. Rebuild application: npm run build';
  RAISE NOTICE '4. Restart application';
END $$;
