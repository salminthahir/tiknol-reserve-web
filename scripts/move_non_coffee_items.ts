import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Moving non-coffee items to NON-COFFEE category...');

    // 1. Move by ID prefix "non_"
    const byId = await prisma.product.updateMany({
        where: {
            AND: [
                { category: 'COFFEE' }, // Only move from COFFEE
                { id: { startsWith: 'non_', mode: 'insensitive' } }
            ]
        },
        data: { category: 'NON-COFFEE' }
    });
    console.log(`Moved ${byId.count} items based on ID prefix 'non_'.`);

    // 2. Move by Keywords (Safety net for items without non_ prefix)
    const keywords = ['Idol', 'Matcha', 'Coklat', 'Taro', 'Red Velvet', 'Soda', 'Tea', 'Chocolate'];

    for (const keyword of keywords) {
        const byKeyword = await prisma.product.updateMany({
            where: {
                AND: [
                    { category: 'COFFEE' },
                    { name: { contains: keyword, mode: 'insensitive' } }
                ]
            },
            data: { category: 'NON-COFFEE' }
        });
        if (byKeyword.count > 0) {
            console.log(`Moved ${byKeyword.count} items containing keyword '${keyword}'.`);
        }
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
