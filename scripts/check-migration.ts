import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying data migration...');

    try {
        const headOffice = await prisma.branch.findUnique({
            where: { code: 'HQ' }
        });

        if (!headOffice) {
            console.error('❌ Head Office branch NOT found!');
            return;
        }
        console.log('✅ Head Office found:', headOffice.id);

        const counts = {
            orders: await prisma.order.count({ where: { branchId: headOffice.id } }),
            employees: await prisma.employee.count({ where: { branchId: headOffice.id } }),
            attendances: await prisma.attendance.count({ where: { branchId: headOffice.id } }),
            shifts: await prisma.shift.count({ where: { branchId: headOffice.id } }),
            products: await prisma.productBranch.count({ where: { branchId: headOffice.id } })
        };

        console.log('📊 Migration Stats (in Head Office):');
        console.log('   Orders:      ', counts.orders);
        console.log('   Employees:   ', counts.employees);
        console.log('   Attendances: ', counts.attendances);
        console.log('   Shifts:      ', counts.shifts);
        console.log('   ProductBranches:', counts.products);

        if (counts.orders > 0 || counts.employees > 0) {
            console.log('✅ Data migration appears SUCCESSFUL (records found in HQ branch)');
        } else {
            console.log('⚠️  No data found in HQ branch (Check if source DB was empty?)');
        }

    } catch (e: any) {
        console.error('❌ Verification failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
