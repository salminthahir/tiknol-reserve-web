# Multi-Branch Migration Guide

## ⚠️ CRITICAL: Read This Before Proceeding

This migration is a **BREAKING CHANGE** that will require application downtime of approximately 30-40 minutes.

**Prerequisites:**
- [ ] Database backup completed
- [ ] Maintenance window scheduled
- [ ] All users notified of downtime
- [ ] Rollback plan prepared

---

## Step-by-Step Migration Procedure

### Step 1: Backup Database

```bash
# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Adjust connection details for your Supabase instance
pg_dump -U postgres -h <your-supabase-host>.supabase.co \
  -d postgres \
  --clean --if-exists \
  > "backup_pre_multibranch_${TIMESTAMP}.sql"

# Verify backup created
ls -lh backup_pre_multibranch_*.sql
```

**Expected:** Backup file > 0 bytes

---

### Step 2: Stop Application

```bash
# If using PM2
pm2 stop all

# If using systemd
sudo systemctl stop your-app-name

# Verify stopped
curl http://localhost:3000
# Expected: Connection refused
```

---

### Step 3: Run Prisma Migration

```bash
cd /path/to/titik-nol-reserve

# Generate Prisma migration
npx prisma migrate dev --name add_multi_branch_support

# Review migration SQL
cat prisma/migrations/*_add_multi_branch_support/migration.sql
```

**Expected:** Migration files created successfully

---

### Step 4: Seed Default Branch

```bash
# Run seed script to create Head Office branch
npx ts-node prisma/seed-multibranch.ts
```

**Expected Output:**
```
🌱 Seeding default branch for multi-branch system...
✅ Created/verified branch: Head Office
   ID: branch_head_office
   Code: HQ
   Location: -6.2 106.816666

📊 Existing data statistics:
   Orders:       150
   Employees:    12
   Attendances:  340
   Shifts:       25
   Products:     35
```

---

### Step 5: Migrate Data

```bash
# Execute SQL migration script
# Replace <your-supabase-host> with actual hostname from .env
psql -U postgres -h <your-supabase-host>.supabase.co -d postgres \
  -f scripts/migrate-to-multibranch.sql
```

**Expected Output:**
```
NOTICE:  Migrated 150 orders to Head Office
NOTICE:  ✅ All orders migrated successfully
NOTICE:  Migrated 12 employees to Head Office
NOTICE:  ✅ All employees migrated successfully
NOTICE:  Migrated 340 attendance records to Head Office
NOTICE:  ✅ All attendances migrated successfully
NOTICE:  Migrated 25 shifts to Head Office
NOTICE:  ✅ All shifts migrated successfully
NOTICE:  Created 35 ProductBranch records
NOTICE:  ✅ All products have branch assignments

📊 MIGRATION SUMMARY:
  Orders:      150
  Employees:   12
  Attendances: 340
  Shifts:      25
  Products:    35 (via ProductBranch)

NOTICE:  ✅ Multi-branch migration completed successfully!
COMMIT
```

---

### Step 6: Verify Migration

```bash
# Regenerate Prisma Client
npx prisma generate

# Launch Prisma Studio to verify
npx prisma studio
```

**Manual Checks:**
- [ ] Branch table has 1 record (Head Office)
- [ ] All Orders have branchId = 'branch_head_office'
- [ ] All Employees have branchId = 'branch_head_office'
- [ ] All Attendances have branchId = 'branch_head_office'
- [ ] All Shifts have branchId = 'branch_head_office'
- [ ] ProductBranch table has records (count = number of products)

---

### Step 7: Rebuild & Restart Application

```bash
# Rebuild with new schema
npm run build

# Start application
pm2 start all
# or
sudo systemctl start your-app-name

# Verify application started
curl http://localhost:3000
# Expected: 200 OK
```

---

### Step 8: Smoke Testing

#### Test 1: Staff Login
```bash
curl -X POST http://localhost:3000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "EMP-001"}'
```

**Expected:** Response includes `"branchId": "branch_head_office"`

#### Test 2: Create Order (POS)
- Login to POS as staff
- Create a cash order
- Verify in database: order has `branchId = 'branch_head_office'`

#### Test 3: Clock In
- Access `/attendance` as employee
- Clock in
- Verify attendance record has correct branchId

---

## Rollback Procedure (Emergency Only)

```bash
# 1. Stop application
pm2 stop all

# 2. Restore database
psql -U postgres -h <your-supabase-host>.supabase.co -d postgres \
  < backup_pre_multibranch_<timestamp>.sql

# 3. Checkout code to previous commit
git log --oneline -10
git checkout <previous_commit_hash>

# 4. Regenerate Prisma client
npx prisma generate

# 5. Rebuild
npm run build

# 6. Restart
pm2 start all
```

---

## Timeline

| Step | Estimated Time | Critical? |
|------|---------------|-----------|
| Database Backup | 2-5 min | ✅ YES |
| Stop App | 1 min | ✅ YES |
| Prisma Migration | 2-3 min | ✅ YES |
| Seed Branch | 1 min | ✅ YES |
| Data Migration | 5-10 min | ✅ YES |
| Verification | 5 min | ✅ YES |
| Rebuild & Restart | 2-5 min | ✅ YES |
| Smoke Testing | 10 min | ⚠️ Recommended |
| **TOTAL** | **~30-40 min** | |

---

## Post-Migration Tasks

- [ ] Monitor error logs for any branch-related issues
- [ ] Verify all API endpoints return branchId in responses
- [ ] Test employee branch isolation
- [ ] Update documentation for new branch field requirements
- [ ] Plan creation of additional branches (if needed)

---

## Support

If you encounter issues during migration:
1. **DO NOT PANIC** - database backup exists
2. Check migration logs for specific error messages
3. Verify all SQL statements completed successfully
4. If data integrity compromised, use rollback procedure immediately
5. Document the error and review implementation plan

---

**Created:** 2026-02-10  
**Version:** 1.0
