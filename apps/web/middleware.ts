import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;
  
  // Protected paths regex
  const isProtectedPath = request.nextUrl.pathname.startsWith("/patient") || 
                          request.nextUrl.pathname.startsWith("/doctor") || 
                          request.nextUrl.pathname.startsWith("/admin");

  if (isProtectedPath && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthPage = request.nextUrl.pathname === "/" || 
                     request.nextUrl.pathname === "/login" || 
                     request.nextUrl.pathname === "/register";

  if (isAuthPage && token) {
    try {
      // Decode JWT payload (base64url to base64)
      const tokenParts = token.split('.');
      if (tokenParts.length < 2) throw new Error("Invalid token");
      
      const base64Url = tokenParts[1] as string;
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      const role = payload.role;
      
      const redirectUrl = request.nextUrl.clone();
      if (role === "doctor") redirectUrl.pathname = "/doctor";
      else if (role === "admin") redirectUrl.pathname = "/admin";
      else redirectUrl.pathname = "/patient";
      return NextResponse.redirect(redirectUrl);
    } catch (e) {
      console.error("Middleware token decode error:", e);
      // If token is invalid, let them stay on auth page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
