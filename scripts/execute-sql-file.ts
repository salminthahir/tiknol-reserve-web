import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: npx ts-node scripts/execute-sql-file.ts <path-to-sql-file>');
        process.exit(1);
    }

    const filePath = args[0];
    const absolutePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`File not found: ${absolutePath}`);
        process.exit(1);
    }

    console.log(`Executing SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(absolutePath, 'utf8');

    // Helper to split SQL by semicolon, respecting $$ quote blocks
    // Simplified parser:
    // 1. Iterate characters
    // 2. Track if inside 'string' or "string" or $$ string $$
    // 3. Split on ; only if not inside string

    function splitSql(sql: string): string[] {
        const statements: string[] = [];
        let current = '';
        let i = 0;
        let inQuote = false;
        let quoteChar = ''; // ' or " or $

        while (i < sql.length) {
            const char = sql[i];
            const next = sql[i + 1] || '';

            // Handle quoting
            if (!inQuote) {
                if (char === "'" || char === '"') {
                    inQuote = true;
                    quoteChar = char;
                } else if (char === '$' && next === '$') {
                    inQuote = true;
                    quoteChar = '$$';
                    current += char + next;
                    i += 2;
                    continue;
                }
            } else {
                // Inside quote
                if (quoteChar === '$$') {
                    if (char === '$' && next === '$') {
                        inQuote = false;
                        current += char + next;
                        i += 2;
                        continue;
                    }
                } else {
                    if (char === quoteChar) {
                        // Check for escaped quote? SQL uses '' for escaping '
                        // Simplified: just toggle off. 
                        // Valid SQL usually doesn't have escaped quotes in structure definition outside literal values.
                        inQuote = false;
                    }
                }
            }

            if (char === ';' && !inQuote) {
                if (current.trim()) {
                    statements.push(current.trim());
                }
                current = '';
            } else {
                current += char;
            }
            i++;
        }

        if (current.trim()) {
            statements.push(current.trim());
        }

        return statements;
    }

    const statements = splitSql(sqlContent);
    console.log(`Found ${statements.length} SQL statements to execute.`);

    try {
        for (const stmt of statements) {
            // Skip transaction control statements if using them
            if (stmt.toUpperCase() === 'BEGIN' || stmt.toUpperCase() === 'COMMIT') {
                continue;
            }

            console.log(`Running statement...`);
            await prisma.$executeRawUnsafe(stmt);
        }
        console.log('✅ SQL executed successfully');
    } catch (error) {
        console.error('❌ Error executing SQL:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
