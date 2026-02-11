import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of Current Placeholders -> New Real Unsplash Images
const replacements: Record<string, string> = {
    // Sate Taichan
    'https://placehold.co/600x400/png?text=Sate+Taichan': 'https://images.unsplash.com/photo-1662970725359-2c7847c2aa43',
    // Coklat Series
    'https://placehold.co/600x400/png?text=Choco+Series': 'https://images.unsplash.com/photo-1544787210-22bb830d5966',
    // Nasi Goreng
    'https://placehold.co/600x400/png?text=Nasi+Goreng': 'https://images.unsplash.com/photo-1603133872878-684f10842619',
    // Snack Platter (Pisor Sambal Roa, Tahu Walik)
    'https://placehold.co/600x400/png?text=Snack+Platter': 'https://images.unsplash.com/photo-1541592103007-ce9a133fa43e',
    // Fries & Snacks (Kentang Goreng, Cheese Roll)
    'https://placehold.co/600x400/png?text=Fries+%26+Snacks': 'https://images.unsplash.com/photo-1630384060421-a4323ceca041',
    // Rice Bowl (Chicken Teriyaki, Chicken Garage)
    'https://placehold.co/600x400/png?text=Rice+Bowl': 'https://images.unsplash.com/photo-1596450502127-6d601d3680e6',
};

async function main() {
    console.log('Replacing Placeholders with Real Images in Database...');

    for (const [placeholderUrl, newUrl] of Object.entries(replacements)) {
        const result = await prisma.product.updateMany({
            where: { image: placeholderUrl },
            data: { image: newUrl }
        });
        console.log(`Replaced ${placeholderUrl} -> ${newUrl} : ${result.count} products updated.`);
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
