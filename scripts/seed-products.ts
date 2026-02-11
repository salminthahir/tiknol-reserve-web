import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
    // === KOPI SERIES (COLD / ICE) - Base Price Size M ===
    { id: 'kopi_001', name: 'Americano', description: 'Kopi hitam segar (Ice).', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_002', name: 'Coconut Kopi', description: 'Kopi dengan rasa kelapa yang unik.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_003', name: 'Tiknol Kopi', description: 'Kopi susu gula aren signature Titik Nol.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_004', name: 'Tiknol Fruity', description: 'Kopi dengan sensasi rasa buah yang segar.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_005', name: 'Cappucino Kopi', description: 'Cappucino dingin yang creamy.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_006', name: 'Klepon Kopi', description: 'Kopi dengan cita rasa kue klepon tradisional.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_007', name: 'Caramel Macchiato', description: 'Perpaduan kopi, susu, dan saus karamel.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_008', name: 'Hazelnut Kopi', description: 'Kopi susu dengan aroma hazelnut.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_009', name: 'Vanilla Kopi', description: 'Kopi susu dengan aroma vanilla yang lembut.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_010', name: 'Kopi Aren', description: 'Kopi susu classic dengan gula aren asli.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'kopi_011', name: 'V60', description: 'Manual brew V60 Japanese style.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },

    // === KOPI SERIES (HOT) ===
    { id: 'kopi_012', name: 'Tiknol Panas', description: 'Kopi tubruk/saring panas signature.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'kopi_013', name: 'Kopi Latte Panas', description: 'Hot Cafe Latte.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'kopi_014', name: 'Cappucino Panas', description: 'Hot Cappuccino.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'kopi_015', name: 'Single Origin', description: 'Kopi manual brew single origin beans.', price: 20000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'kopi_016', name: 'Titik Literan', description: 'Kopi botolan ukuran 1 Liter.', price: 115000, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', hasCustomization: false, customizationOptions: null },

    // === NON-KOPI SERIES (COLD) ===
    { id: 'non_001', name: 'Matcha', description: 'Greentea matcha latte.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_002', name: 'Coklat Milk', description: 'Susu coklat creamy.', price: 20000, category: 'Non-Coffee', image: 'https://placehold.co/600x400/png?text=Choco+Series', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_003', name: 'Taro Milk', description: 'Susu rasa taro yang unik.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_004', name: 'Stroberi Tea', description: 'Teh rasa stroberi segar.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_005', name: 'Stroberi Coconut', description: 'Perpaduan stroberi dan kelapa.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_006', name: 'Tiknol Soda', description: 'Minuman soda signature segar.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_007', name: 'Red Velvet', description: 'Minuman rasa red velvet cake.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_008', name: 'Coklat Vanilla', description: 'Perpaduan coklat dan vanilla.', price: 20000, category: 'Non-Coffee', image: 'https://placehold.co/600x400/png?text=Choco+Series', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_009', name: 'Coklat Caramel', description: 'Coklat dengan saus karamel.', price: 20000, category: 'Non-Coffee', image: 'https://placehold.co/600x400/png?text=Choco+Series', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_010', name: 'Coklat Hazelnut', description: 'Coklat dengan aroma hazelnut.', price: 20000, category: 'Non-Coffee', image: 'https://placehold.co/600x400/png?text=Choco+Series', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_011', name: 'Coklat Coconut', description: 'Coklat dengan rasa kelapa.', price: 20000, category: 'Non-Coffee', image: 'https://placehold.co/600x400/png?text=Choco+Series', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },
    { id: 'non_012', name: 'Lemon Tea', description: 'Es teh lemon segar.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: true, customizationOptions: { sizes: ['M', 'L'] } },

    // === NON-KOPI SERIES (HOT / LAINNYA) ===
    { id: 'non_013', name: 'Coklat Panas', description: 'Hot Chocolate.', price: 20000, category: 'Non-Coffee', image: 'https://placehold.co/600x400/png?text=Choco+Series', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'non_014', name: 'Taro Panas', description: 'Hot Taro Latte.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'non_015', name: 'Matcha Panas', description: 'Hot Matcha Latte.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: false, customizationOptions: { temps: ['HOT'] } },
    { id: 'non_016', name: 'Tiknol Curah', description: 'Minuman signature curah.', price: 20000, category: 'Non-Coffee', image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7', hasCustomization: false, customizationOptions: null },

    // === MEALS ===
    { id: 'food_001', name: 'Nasi Chicken Teriyaki', description: 'Nasi dengan ayam saus teriyaki.', price: 23000, category: 'Meals', image: 'https://placehold.co/600x400/png?text=Rice+Bowl', hasCustomization: false, customizationOptions: null },
    { id: 'food_002', name: 'Nasgor Tiknol', description: 'Nasi goreng spesial Tiknol.', price: 23000, category: 'Meals', image: 'https://placehold.co/600x400/png?text=Nasi+Goreng', hasCustomization: false, customizationOptions: null },
    { id: 'food_003', name: 'Nasgor Sambal Roa', description: 'Nasi goreng dengan sambal roa pedas.', price: 23000, category: 'Meals', image: 'https://placehold.co/600x400/png?text=Nasi+Goreng', hasCustomization: false, customizationOptions: null },
    { id: 'food_004', name: 'Nasi Chicken Garage', description: 'Nasi ayam spesial garage.', price: 23000, category: 'Meals', image: 'https://placehold.co/600x400/png?text=Rice+Bowl', hasCustomization: false, customizationOptions: null },
    { id: 'food_005', name: 'Sate Taichan', description: 'Sate ayam putih dengan sambal pedas.', price: 23000, category: 'Meals', image: 'https://placehold.co/600x400/png?text=Sate+Taichan', hasCustomization: false, customizationOptions: null },

    // === SNACKS ===
    { id: 'food_006', name: 'Indomie Kuah', description: 'Indomie rebus lengkap dengan topping.', price: 13000, category: 'Snacks', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841', hasCustomization: false, customizationOptions: null },
    { id: 'food_007', name: 'Indomie Goreng', description: 'Indomie goreng lengkap dengan topping.', price: 13000, category: 'Snacks', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841', hasCustomization: false, customizationOptions: null },
    { id: 'food_008', name: 'Nasi Putih', description: 'Nasi putih tambahan.', price: 5000, category: 'Snacks', image: 'https://placehold.co/600x400/png?text=Rice+Bowl', hasCustomization: false, customizationOptions: null },
    { id: 'food_009', name: 'Tahu Walik', description: 'Tahu goreng isi adonan daging/aci.', price: 18000, category: 'Snacks', image: 'https://placehold.co/600x400/png?text=Snack+Platter', hasCustomization: false, customizationOptions: null },
    { id: 'food_010', name: 'Pis-Gor Sambal Roa', description: 'Pisang goreng dicocol sambal roa.', price: 23000, category: 'Snacks', image: 'https://placehold.co/600x400/png?text=Snack+Platter', hasCustomization: false, customizationOptions: null },
    { id: 'food_011', name: 'Kentang Goreng', description: 'French fries original.', price: 18000, category: 'Snacks', image: 'https://placehold.co/600x400/png?text=Fries+%26+Snacks', hasCustomization: false, customizationOptions: null },
    { id: 'food_012', name: 'Cheese Roll', description: 'Keju gulung goreng renyah.', price: 13000, category: 'Snacks', image: 'https://placehold.co/600x400/png?text=Fries+%26+Snacks', hasCustomization: false, customizationOptions: null },
    { id: 'food_013', name: 'Donat Kentang 2 Mix', description: 'Donat kentang dengan topping mix.', price: 18000, category: 'Snacks', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a', hasCustomization: false, customizationOptions: null },
    { id: 'food_014', name: 'Churros', description: 'Spanish donut stick dengan saus coklat.', price: 13000, category: 'Snacks', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a', hasCustomization: false, customizationOptions: null },
];

async function main() {
    console.log('🍔 Seeding Products...\n');

    let created = 0;
    let updated = 0;

    for (const p of products) {
        const result = await prisma.product.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                description: p.description,
                price: p.price,
                category: p.category,
                image: p.image,
                hasCustomization: p.hasCustomization,
                customizationOptions: p.customizationOptions as any,
            },
            create: {
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                category: p.category,
                image: p.image,
                hasCustomization: p.hasCustomization,
                customizationOptions: p.customizationOptions as any,
            },
        });

        const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
        if (isNew) created++;
        else updated++;
    }

    console.log(`✅ Products: ${created} created, ${updated} updated (Total: ${products.length})`);

    // === Auto-create ProductBranch for all active branches ===
    console.log('\n🔗 Linking products to branches...');

    const activeBranches = await prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
    });

    if (activeBranches.length === 0) {
        console.log('   No branches found. Creating Head Office...');
        const hq = await prisma.branch.upsert({
            where: { id: 'branch_head_office' },
            update: {},
            create: {
                id: 'branch_head_office',
                code: 'HQ',
                name: 'Head Office',
                isActive: true,
            }
        });
        activeBranches.push({ id: hq.id, name: hq.name });
    }

    let linkedCount = 0;
    for (const branch of activeBranches) {
        for (const p of products) {
            const exists = await prisma.productBranch.findUnique({
                where: {
                    productId_branchId: { productId: p.id, branchId: branch.id }
                }
            });

            if (!exists) {
                await prisma.productBranch.create({
                    data: {
                        productId: p.id,
                        branchId: branch.id,
                        isAvailable: true,
                        branchPrice: null,
                    }
                });
                linkedCount++;
            }
        }
        console.log(`   ✅ Branch "${branch.name}" — linked.`);
    }

    console.log(`\n🎉 Done! ${linkedCount} new ProductBranch records created.`);
    console.log(`📦 Total products in DB: ${await prisma.product.count()}`);
}

main()
    .catch(e => { console.error('❌ Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
