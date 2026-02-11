import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Simulating API Logic for Staff (Alan)...');

    // Simulate Session Data for Alan (EMP-001)
    const session = {
        userId: 'EMP-001',
        role: 'STAFF',
        branchId: 'cmlgiiwfm0000wcrdam1b05zu', // ID for Titik Nol Malang
        isGlobalAccess: false
    };

    console.log('Session Context:', session);

    let branchFilter: any = {};

    // Logic from /api/admin/orders/route.ts
    if (session.branchId) {
        branchFilter = { branchId: session.branchId };
        console.log('Filter applied:', branchFilter);
    } else {
        console.log('NO BRANCH FILTER APPLIED!');
    }

    // 1. Check Total Orders first
    const totalOrders = await prisma.order.count();
    console.log(`Total Orders in DB: ${totalOrders}`);

    // 2. Check Orders for this specific branch
    const branchOrders = await prisma.order.findMany({
        where: { branchId: session.branchId }
    });
    console.log(`Total Orders for Branch ${session.branchId}: ${branchOrders.length}`);

    // 3. Simulate API Filter Logic
    console.log('--- Simulating API Query ---');
    const orders = await prisma.order.findMany({
        where: {
            status: { not: 'PENDING' },
            ...branchFilter
        },
        select: {
            id: true,
            branchId: true,
            branch: { select: { name: true } },
            status: true
        },
        take: 20
    });

    console.log(`API Found ${orders.length} orders.`);
    orders.forEach(o => {
        // Check if LEAK
        if (o.branchId !== session.branchId) {
            console.error(`[LEAK] Order ${o.id} is from ${o.branch.name} (${o.branchId}) but session is ${session.branchId}`);
        } else {
            console.log(`[OK] Order ${o.id} | ${o.branch.name} | Status: ${o.status}`);
        }
    });

    // 4. Force check leak (find orders NOT from this branch)
    const leakage = await prisma.order.findFirst({
        where: {
            status: { not: 'PENDING' },
            ...branchFilter,
            branchId: { not: session.branchId }
        }
    });

    if (leakage) {
        console.error("PRISMA FILTER FAILURE DETECTED! Found order from other branch despite filter.");
    } else {
        console.log("Prisma filter is robust. No orders from other branches found with this filter.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
