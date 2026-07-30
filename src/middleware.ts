import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/report", "/profile", "/team", "/reports", "/my-reports", "/safety", "/contacts", "/admin", "/updates"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get("bizwatch_session");
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!session?.value && isProtected) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/report/:path*", "/profile/:path*", "/team", "/team/:path*", "/reports/:path*", "/my-reports/:path*", "/safety", "/safety/:path*", "/contacts/:path*", "/admin/:path*", "/updates", "/updates/:path*"],
};
