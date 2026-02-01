// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Cek Middleware Menu (Existing)
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  // Cek apakah user sedang mengakses halaman /menu DAN membawa order_id
  if (request.nextUrl.pathname.startsWith('/menu') && orderId) {
    // LANGSUNG LEMPAR KE HALAMAN TIKET (Server Side Redirect)
    const ticketUrl = new URL(`/ticket/${orderId}`, request.url);
    return NextResponse.redirect(ticketUrl);
  }

  // 2. Protect Super Admin Routes
  // Exclude API routes to prevent blocking auth requests (optional, but good practice)
  // But here we only match /super-admin... wait, login API is at /api/auth/super-admin/login.
  // Middleware matcher config handles the scope.

  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    const isLoginPage = request.nextUrl.pathname === '/super-admin/login';
    const hasSession = request.cookies.has('super_admin_session');

    if (!hasSession && !isLoginPage) {
      // Redirect to login if trying to access restricted page without session
      return NextResponse.redirect(new URL('/super-admin/login', request.url));
    }

    if (hasSession && isLoginPage) {
      // Redirect to dashboard if trying to login while already authenticated
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Tentukan middleware ini aktif di mana saja
export const config = {
  matcher: ['/menu', '/super-admin/:path*'],
};