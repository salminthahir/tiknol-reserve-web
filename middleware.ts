// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  // Cek apakah user sedang mengakses halaman /menu DAN membawa order_id
  if (request.nextUrl.pathname.startsWith('/menu') && orderId) {
    // LANGSUNG LEMPAR KE HALAMAN TIKET (Server Side Redirect)
    // Ini jauh lebih cepat daripada menunggu React loading di browser
    const ticketUrl = new URL(`/ticket/${orderId}`, request.url);
    return NextResponse.redirect(ticketUrl);
  }

  return NextResponse.next();
}

// Tentukan middleware ini aktif di mana saja
export const config = {
  matcher: '/menu',
};