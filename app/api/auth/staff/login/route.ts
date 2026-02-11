import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeId } = body;

        if (!employeeId) {
            return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
        }

        const normalizedId = employeeId.toUpperCase();

        // 1. Verify Employee Exists & Is Active
        const employee = await prisma.employee.findUnique({
            where: { id: normalizedId },
            include: {
                branch: true,
                accessibleBranches: {
                    include: { branch: true }
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ message: 'Employee ID not found' }, { status: 401 });
        }

        if (!employee.isActive) {
            return NextResponse.json({ message: 'Account is inactive. Contact Administrator.' }, { status: 403 });
        }

        // 2. Create Secure Session
        const cookieStore = await cookies();

        // Calculate Access
        const additionalAccess = employee.accessibleBranches.map(ab => ({
            branchId: ab.branchId,
            branchName: ab.branch.name
        }));

        // Payload Sesi
        const sessionData = {
            userId: employee.id,
            name: employee.name,
            role: employee.role,
            isStaff: true,
            // Branch Context
            branchId: employee.branchId,
            branchName: employee.branch?.name || 'Unknown Branch',
            // Access Control
            isGlobalAccess: employee.isGlobalAccess || false,
            additionalAccess: additionalAccess
        };

        cookieStore.set('staff_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 Day
            path: '/',
            sameSite: 'lax'
        });

        return NextResponse.json({ success: true, user: sessionData });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
