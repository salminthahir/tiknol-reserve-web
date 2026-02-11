import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET /api/auth/me - Returns current session data for client-side use
// Reads the httpOnly staff_session cookie and returns user info including branchId
export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('staff_session');

        if (!sessionCookie?.value) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);

        return NextResponse.json({
            authenticated: true,
            userId: session.userId,
            name: session.name,
            role: session.role,
            branchId: session.branchId,
            branchName: session.branchName,
            isGlobalAccess: session.isGlobalAccess || false,
        });
    } catch (error) {
        console.error('Error reading session:', error);
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
