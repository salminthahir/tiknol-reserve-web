# Migration Safety Issue & Resolution

## Issue Detected

Prisma migrate detected **schema drift** - the database has tables (Attendance, Employee, Settings) that don't exist in the migration history.

**Prisma's Default Behavior:** Reset entire schema (⚠️ **DELETES ALL DATA**)

## Safe Migration Approach (RECOMMENDED)

Instead of using `prisma migrate dev` which wants to reset, we'll use manual SQL migration:

### Step 1: Create Migration File Manually

Already created in `scripts/migrate-to-multibranch.sql`

### Step 2: Apply Migration Directly to Database

Use `psql` to apply the migration with transaction safety.

### Step 3: Mark Migration as Applied

Use `prisma migrate resolve` to update migration history without applying.

---

## Alternative: Use Prisma Baseline

Mark current state as baseline, then apply new migrations only.

---

## Recommendation

Proceed with **manual SQL migration** approach for maximum safety and control.
