import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Analyzing product categories...');

    const products = await prisma.product.findMany({
        select: {
            category: true
        },
        distinct: ['category']
    });

    console.log('Current Distinct Categories:');
    products.forEach(p => console.log(`- "${p.category}"`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
