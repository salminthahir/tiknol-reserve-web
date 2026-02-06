import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Hapus session cookie
        cookieStore.delete('staff_session');

        return NextResponse.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
