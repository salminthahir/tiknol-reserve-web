import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting Employees and their Branch Settings...');

    const employees = await prisma.employee.findMany({
        include: {
            branch: true,
            accessibleBranches: true
        }
    });

    console.log('--- Employee List ---');
    employees.forEach(e => {
        console.log(`ID: ${e.id} | Name: ${e.name} | Role: ${e.role}`);
        console.log(`   -> Home Branch: ${e.branch.name} (${e.branchId})`);
        console.log(`   -> Global Access: ${e.isGlobalAccess}`);
        console.log(`   -> Additional Access: ${e.accessibleBranches.length > 0 ? e.accessibleBranches.map(a => a.branchId).join(', ') : 'None'}`);
        console.log('-----------------------------------');
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
