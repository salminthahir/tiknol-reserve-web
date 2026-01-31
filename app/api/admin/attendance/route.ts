import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD

    if (!dateStr) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const attendances = await prisma.attendance.findMany({
            where: {
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                employee: {
                    select: { name: true, role: true }
                }
            },
            orderBy: {
                timestamp: 'desc'
            }
        });

        return NextResponse.json(attendances);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}
