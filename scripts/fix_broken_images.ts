import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of broken URLs to new Placeholders (or better Generic Images)
const replacements: Record<string, string> = {
    // Sate Taichan
    'https://images.unsplash.com/photo-1593741683466-bbf3db08a33f': 'https://placehold.co/600x400/png?text=Sate+Taichan',
    // Coklat Series
    'https://images.unsplash.com/photo-1544787210-22bb830d5966': 'https://placehold.co/600x400/png?text=Choco+Series',
    // Nasgor
    'https://images.unsplash.com/photo-1603133872878-684f10842619': 'https://placehold.co/600x400/png?text=Nasi+Goreng',
    // Snacks (Tahu Walik, Pisgor)
    'https://images.unsplash.com/photo-1626109968837-a1691361c77e': 'https://placehold.co/600x400/png?text=Snack+Platter',
    // Kentang Goreng, Cheese Roll
    'https://images.unsplash.com/photo-1630384060421-a4323ceca041': 'https://placehold.co/600x400/png?text=Fries+%26+Snacks',
    // Missing from list but likely broken if same batch:
    'https://images.unsplash.com/photo-1585109649139-366815a0d713': 'https://placehold.co/600x400/png?text=Rice+Bowl',
};

async function main() {
    console.log('Fixing Broken Images in Database...');

    for (const [brokenUrl, newUrl] of Object.entries(replacements)) {
        const result = await prisma.product.updateMany({
            where: { image: brokenUrl },
            data: { image: newUrl }
        });
        console.log(`Replaced ${brokenUrl} -> ${newUrl} : ${result.count} products updated.`);
    }

    // Fallback cleanup for any other broken unsplash links if needed
    // ...
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
