import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Listing items in COFFEE category...');

    const products = await prisma.product.findMany({
        where: { category: 'COFFEE' },
        select: { id: true, name: true }
    });

    console.log(`Found ${products.length} items in COFFEE:`);
    products.forEach(p => console.log(`- [${p.id}] ${p.name}`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
