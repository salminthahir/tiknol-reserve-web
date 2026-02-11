
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Data Migration to Multi-Branch...');

    // 1. Ensure Head Office Branch Exists
    console.log('🏢 Checking/Creating Head Office Branch...');
    const headOffice = await prisma.branch.upsert({
        where: { id: 'branch_head_office' },
        update: {},
        create: {
            id: 'branch_head_office',
            code: 'HQ',
            name: 'Titik Nol Pusat',
            address: 'Jl. Pemuda No. 1',
            phone: '081234567890',
            isActive: true
        }
    });
    console.log(`✅ Head Office Ready: ${headOffice.name} (${headOffice.id})`);

    // 2. Migrate Orders
    console.log('📦 Migrating Orders...');
    const ordersResult = await prisma.order.updateMany({
        where: { branchId: { equals: 'branch_head_office' } }, // Dummy logic to keep syntax valid but we rely on raw query below
        data: {}
    });

    // Raw query to handle potential NULLs or existing data without branchId
    const updateOrders = await prisma.$executeRaw`UPDATE "Order" SET "branchId" = 'branch_head_office' WHERE "branchId" IS NULL OR "branchId" = ''`;
    console.log(`   - Updated ${updateOrders} orders.`);

    // 3. Migrate Employees
    console.log('👥 Migrating Employees...');
    const updateEmployees = await prisma.$executeRaw`UPDATE "Employee" SET "branchId" = 'branch_head_office' WHERE "branchId" IS NULL OR "branchId" = ''`;
    console.log(`   - Updated ${updateEmployees} employees.`);

    // 4. Migrate Attendances
    console.log('📅 Migrating Attendances...');
    const updateAttendances = await prisma.$executeRaw`UPDATE "Attendance" SET "branchId" = 'branch_head_office' WHERE "branchId" IS NULL OR "branchId" = ''`;
    console.log(`   - Updated ${updateAttendances} attendances.`);

    // 5. Migrate Shifts
    console.log('⏱️ Migrating Shifts...');
    const updateShifts = await prisma.$executeRaw`UPDATE "Shift" SET "branchId" = 'branch_head_office' WHERE "branchId" IS NULL OR "branchId" = ''`;
    console.log(`   - Updated ${updateShifts} shifts.`);

    // 6. Populate ProductBranch (Crucial for "Missing Products" issue)
    console.log('🍔 Populating ProductBranch for HQ...');
    const allProducts = await prisma.product.findMany({ select: { id: true } });
    console.log(`   Found ${allProducts.length} total products.`);

    let createdCount = 0;
    for (const p of allProducts) {
        const exists = await prisma.productBranch.findUnique({
            where: {
                productId_branchId: {
                    productId: p.id,
                    branchId: 'branch_head_office'
                }
            }
        });

        if (!exists) {
            await prisma.productBranch.create({
                data: {
                    productId: p.id,
                    branchId: 'branch_head_office',
                    isAvailable: true
                }
            });
            createdCount++;
        }
    }
    console.log(`   - Created ${createdCount} ProductBranch records.`);

    console.log('✨ Migration Complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
