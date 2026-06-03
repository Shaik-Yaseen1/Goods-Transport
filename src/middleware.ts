import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (token?.role !== "ADMIN") {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/owner") && !pathname.startsWith("/owner/login")) {
    if (token?.role !== "OWNER") {
      const url = new URL("/owner/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  /* Customer login auth — disabled for now
  const customerPaths = ["/book", "/history"];
  const isCustomerPath = customerPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isCustomerPath) {
    if (token?.role !== "USER") {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && token?.role === "USER") {
    return NextResponse.redirect(new URL("/book", req.url));
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/((?!login).*)",
    "/owner/((?!login).*)",
    // "/book/:path*",
    // "/history/:path*",
    // "/login",
    // "/register",
  ],
};
