import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for ALL unsplash images to debug...');

    const allProducts = await prisma.product.findMany({
        where: {
            image: { contains: 'unsplash' }
        },
        select: {
            id: true,
            name: true,
            image: true
        }
    });

    console.log(`Found ${allProducts.length} products with Unsplash images.`);
    allProducts.forEach(p => {
        console.log(`[${p.id}] ${p.name} -> ${p.image}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
