import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API ini dipanggil SETELAH login sukses di Client (Supabase/Credentials)
// Tujuannya: Membuat Secure Cookie agar Middleware bisa melindungi API
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, userId, role } = body;

        // Di sini kita bisa validasi token Supabase jika perlu (untuk extra security)
        // Untuk tahap ini, kita percaya data yang dikirim client setelah login sukses

        const cookieStore = await cookies();

        // Set Cookie 'staff_session' yang HTTP Only (Tidak bisa diakses JS)
        // Ini menggantikan document.cookie yang tidak aman
        cookieStore.set('staff_session', JSON.stringify({ userId, email, role: role || 'STAFF' }), {
            httpOnly: true, // PENTING: Anti XSS
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 Hari
            path: '/',
            sameSite: 'lax'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
    }
}
