import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Standardizing product categories...');

    // 1. "Snacks" -> "SNACK"
    const snacks = await prisma.product.updateMany({
        where: {
            category: {
                equals: 'Snacks',
                mode: 'insensitive' // Catch "snacks", "SNACKS" (if duplicate logic needed, but here target is SNACK)
            }
        },
        data: { category: 'SNACK' }
    });
    console.log(`Updated ${snacks.count} items from 'Snacks' to 'SNACK'.`);

    // 2. "Meals" -> "MEALS"
    const meals = await prisma.product.updateMany({
        where: {
            category: {
                equals: 'Meals',
                mode: 'insensitive'
            }
        },
        data: { category: 'MEALS' }
    });
    console.log(`Updated ${meals.count} items from 'Meals' to 'MEALS'.`);

    // 3. General Uppercase for any others (just in case)
    const products = await prisma.product.findMany();
    let count = 0;
    for (const p of products) {
        if (p.category !== p.category.toUpperCase()) {
            await prisma.product.update({
                where: { id: p.id },
                data: { category: p.category.toUpperCase() }
            });
            count++;
        }
    }
    console.log(`Converted ${count} other items to UPPERCASE.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
