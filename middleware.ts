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
  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    const isLoginPage = request.nextUrl.pathname === '/super-admin/login';
    const hasSession = request.cookies.has('super_admin_session');

    if (!hasSession && !isLoginPage) {
      return NextResponse.redirect(new URL('/super-admin/login', request.url));
    }

    if (hasSession && isLoginPage) {
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
  }

  // 3. Protect Staff / Admin Routes (POS, Dashboard, AND API)
  // Include /api/admin protection
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) {

    // EXCEPTION: Login API itself must be public (if we had one under /api/admin, but ours is /api/auth)
    // Our login APIs are under /api/auth, so they are safe from this block.

    const hasStaffSession = request.cookies.has('staff_session');
    const hasSuperAdminSession = request.cookies.has('super_admin_session');

    // Allow access if user has EITHER staff OR super_admin session
    if (!hasStaffSession && !hasSuperAdminSession) {
      // Jika request API -> Return 401 JSON
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      // Jika request Page -> Redirect Login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Tentukan middleware ini aktif di mana saja
export const config = {
  matcher: [
    '/menu',
    '/super-admin/:path*',
    '/admin/:path*',
    '/api/admin/:path*' // PROTECT THE API!
  ],
};