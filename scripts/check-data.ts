
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Database Content...');

    try {
        const productCount = await prisma.product.count();
        console.log(`📦 Total Products: ${productCount}`);

        const branchCount = await prisma.branch.count();
        console.log(`🏢 Total Branches: ${branchCount}`);
        const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
        console.log('   Branches:', branches);

        const orderCount = await prisma.order.count();
        console.log(`🧾 Total Orders: ${orderCount}`);

        const productBranchCount = await prisma.productBranch.count();
        console.log(`🔗 Total Product-Branch Links: ${productBranchCount}`);

        if (productCount === 0) {
            console.error("\n❌ CRITICAL: No products found! The database seems empty.");
            console.log("👉 Did you intentionally reset the database? Or are you connected to the wrong project?");
        } else if (productBranchCount === 0) {
            console.error("\n⚠️ Products exist but are not linked to any branch.");
            console.log("👉 The migration script was supposed to fix this. If it failed to find products, something is wrong.");
        } else {
            console.log("\n✅ Data appears to be present.");
        }

    } catch (error) {
        console.error('❌ Connection Error:', error);
    }
}

main().finally(() => prisma.$disconnect());
