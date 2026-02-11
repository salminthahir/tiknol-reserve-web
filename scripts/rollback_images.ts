import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of Real Unsplash Images (Current) -> Placeholders (Target)
const replacements: Record<string, string> = {
    // Sate Taichan
    'https://images.unsplash.com/photo-1662970725359-2c7847c2aa43': 'https://placehold.co/600x400/png?text=Sate+Taichan',
    // Coklat Series
    'https://images.unsplash.com/photo-1544787210-22bb830d5966': 'https://placehold.co/600x400/png?text=Choco+Series',
    // Nasi Goreng
    'https://images.unsplash.com/photo-1603133872878-684f10842619': 'https://placehold.co/600x400/png?text=Nasi+Goreng',
    // Snack Platter
    'https://images.unsplash.com/photo-1541592103007-ce9a133fa43e': 'https://placehold.co/600x400/png?text=Snack+Platter',
    // Fries & Snacks
    'https://images.unsplash.com/photo-1630384060421-a4323ceca041': 'https://placehold.co/600x400/png?text=Fries+%26+Snacks',
    // Rice Bowl
    'https://images.unsplash.com/photo-1596450502127-6d601d3680e6': 'https://placehold.co/600x400/png?text=Rice+Bowl',
};

async function main() {
    console.log('Rolling back to Placeholder Images in Database...');

    for (const [realUrl, placeholderUrl] of Object.entries(replacements)) {
        const result = await prisma.product.updateMany({
            where: { image: realUrl },
            data: { image: placeholderUrl }
        });
        console.log(`Reverted ${realUrl} -> ${placeholderUrl} : ${result.count} products updated.`);
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
