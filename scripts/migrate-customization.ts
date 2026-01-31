// Script to enable customization for existing Coffee items
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCustomization() {
  try {
    console.log('🔄 Starting customization migration...');
    
    // Update all COFFEE items to enable customization
    const result = await prisma.product.updateMany({
      where: {
        OR: [
          { category: { contains: 'COFFEE', mode: 'insensitive' } },
          { category: { contains: 'coffee', mode: 'insensitive' } }
        ]
      },
      data: {
        hasCustomization: true,
        customizationOptions: {
          temps: ['ICE', 'HOT'],
          sizes: ['REGULAR', 'MEDIUM', 'LARGE']
        }
      }
    });
    
    console.log(`✅ Migration complete! Updated ${result.count} Coffee items.`);
    
    // Show updated products
    const coffeeProducts = await prisma.product.findMany({
      where: {
        hasCustomization: true
      },
      select: {
        id: true,
        name: true,
        category: true,
        hasCustomization: true
      }
    });
    
    console.log('\n📋 Products with customization enabled:');
    coffeeProducts.forEach(p => {
      console.log(`   - ${p.name} (${p.category})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCustomization();
