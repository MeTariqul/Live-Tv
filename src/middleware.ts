import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const isAdminLogin = request.nextUrl.pathname === '/admin/login';

  if (isAdminPath && !isAdminLogin && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (isAdminLogin && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
