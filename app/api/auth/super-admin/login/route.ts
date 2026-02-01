import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { pin } = await request.json();

        if (!pin) {
            return NextResponse.json({ message: 'PIN is required' }, { status: 400 });
        }

        // 1. Check against Environment Variable "Master Key" (Fallback)
        // Useful if no employees exist yet or DB is down
        const MASTER_PIN = process.env.SUPER_ADMIN_PIN || '000000'; // Default 000000 if not set, change this in prod!

        let isAuthenticated = false;
        let userRole = 'SUPER_ADMIN';

        if (pin === MASTER_PIN) {
            isAuthenticated = true;
        } else {
            // 2. Check against Database Employees (Role ADMIN)
            const admin = await prisma.employee.findFirst({
                where: {
                    pin: pin,
                    role: 'ADMIN',
                    isActive: true
                }
            });

            if (admin) {
                isAuthenticated = true;
                userRole = admin.role;
            }
        }

        if (isAuthenticated) {
            // Set Cookie
            const cookieStore = await cookies();

            // Simple session cookie (In production, use JWT or proper session ID)
            // For now, we store a simple flag signed/verified by existence
            cookieStore.set('super_admin_session', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24, // 1 Day
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: 'Invalid Credentials' }, { status: 401 });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
