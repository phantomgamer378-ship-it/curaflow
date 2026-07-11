import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const isProtectedRoute = 
    pathname.startsWith('/patient') || 
    pathname.startsWith('/doctor') || 
    pathname.startsWith('/admin');

  // Check if token exists in cookies
  const token = request.cookies.get('authToken')?.value;

  if (isProtectedRoute && !token) {
    // Redirect unauthenticated users to the login page
    const loginUrl = new URL('/login', request.url);
    // Optionally preserve the attempted URL to redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
