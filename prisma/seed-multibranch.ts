import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding default branch for multi-branch system...');

    // 1. Create Head Office branch
    const headOffice = await prisma.branch.upsert({
        where: { code: 'HQ' },
        update: {},
        create: {
            id: 'branch_head_office',
            code: 'HQ',
            name: 'Head Office',
            address: 'Jl. Sudirman No. 123, Jakarta', // SESUAIKAN dengan lokasi real
            phone: '021-12345678', // SESUAIKAN
            latitude: -6.200000, // SESUAIKAN dengan koordinat real
            longitude: 106.816666, // SESUAIKAN
            maxRadius: 100,
            isActive: true,
            openingHours: {
                monday: '08:00-22:00',
                tuesday: '08:00-22:00',
                wednesday: '08:00-22:00',
                thursday: '08:00-22:00',
                friday: '08:00-23:00',
                saturday: '08:00-23:00',
                sunday: '09:00-21:00'
            }
        }
    });

    console.log('✅ Created/verified branch:', headOffice.name);
    console.log('   ID:', headOffice.id);
    console.log('   Code:', headOffice.code);
    console.log('   Location:', headOffice.latitude, headOffice.longitude);

    // 2. Count existing data yang perlu di-migrate
    const counts = {
        orders: await prisma.order.count(),
        employees: await prisma.employee.count(),
        attendances: await prisma.attendance.count(),
        shifts: await prisma.shift.count(),
        products: await prisma.product.count()
    };

    console.log('\n📊 Existing data statistics:');
    console.log('   Orders:      ', counts.orders);
    console.log('   Employees:   ', counts.employees);
    console.log('   Attendances: ', counts.attendances);
    console.log('   Shifts:      ', counts.shifts);
    console.log('   Products:    ', counts.products);

    console.log('\n⚠️  NEXT STEPS:');
    console.log('   1. Review the data above');
    console.log('   2. Run: npx prisma migrate dev --name add_multi_branch_support');
    console.log('   3. Execute: psql -U postgres -h <host> -d postgres -f scripts/migrate-to-multibranch.sql');
    console.log('   4. Verify migration completed successfully');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding branch:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
