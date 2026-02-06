import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
        return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Get start and end of TODAY (Server Time)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    try {
        // 1. Verify Employee Exists FIRST
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        if (!employee.isActive) {
            return NextResponse.json({ error: 'Employee inactive' }, { status: 403 });
        }

        // 2. Find latest attendance record for today (if valid employee)
        const todaysAttendance = await prisma.attendance.findFirst({
            where: {
                employeeId: employeeId,
                timestamp: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            },
            orderBy: {
                timestamp: 'desc'
            }
        });

        // Determine current status
        // If no record -> NOT_CLOCKED_IN
        // If last record was CLOCK_IN -> CLOCKED_IN
        // If last record was CLOCK_OUT -> CLOCKED_OUT (Shift finished)

        let status = 'NOT_CLOCKED_IN';
        let lastClockIn = null;

        if (todaysAttendance) {
            if (todaysAttendance.type === 'CLOCK_IN') {
                status = 'CLOCKED_IN';
                lastClockIn = todaysAttendance.timestamp;
            } else {
                status = 'CLOCKED_OUT';
            }
        }

        return NextResponse.json({
            status,
            lastClockIn,
            serverTime: now
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }
}
