
const { loadEnvConfig } = require('@next/env');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from .env*
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Realtime Configuration Fix...");

    try {
        // 1. Enable Realtime Replication for "Order" table
        // Supabase uses 'supabase_realtime' publication
        console.log("➡️  Enabling Realtime for 'Order' table...");
        try {
            await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Order";`);
            console.log("✅ Realtime enabled successfully.");
        } catch (e) {
            if (e.message.includes('already in publication')) {
                console.log("ℹ️  Table 'Order' is already in supabase_realtime publication.");
            } else {
                console.error("⚠️  Failed to add table to publication (might not exist or permission denied):", e.message);
            }
        }

        // 2. Enable Row Level Security (RLS)
        console.log("➡️  Enabling RLS on 'Order' table...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;`);
        console.log("✅ RLS enabled.");

        // 3. Create RLS Policy for Public Read Access
        console.log("➡️  Configuring RLS Policy for public read access...");

        // Drop existing policy if it exists to clean up
        try {
            await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Enable read access for all" ON "Order";`);
        } catch (e) { /* ignore */ }

        // Create new policy
        await prisma.$executeRawUnsafe(`
      CREATE POLICY "Enable read access for all" 
      ON "Order" 
      FOR SELECT 
      USING (true);
    `);
        console.log("✅ RLS Policy 'Enable read access for all' created.");

    } catch (error) {
        console.error("❌ Critical Error:", error);
    } finally {
        await prisma.$disconnect();
        console.log("🏁 Configuration script finished.");
    }
}

main();
