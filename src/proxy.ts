import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Run intl middleware first
  const response = intlMiddleware(request);

  // 2. Custom Auth Logic
  const segments = pathname.split("/");
  // segments[0] is empty, segments[1] is locale
  const locale = segments[1];
  const restOfPath = segments.slice(2).join("/");

  const isAdminPath = restOfPath.startsWith("admin");
  const isCustomerPath = restOfPath.startsWith("customer");

  if (isAdminPath || isCustomerPath) {
    const roleKey = isAdminPath ? "ADMIN" : "CUSTOMER";
    const token = request.cookies.get(`token_${roleKey}`)?.value || request.cookies.get("token")?.value;

    if (!token) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("role", roleKey.toLowerCase());
      return NextResponse.redirect(loginUrl);
    }

    try {
      const decoded = await verifyToken(token);
      if (!decoded || String(decoded.role).toUpperCase() !== roleKey) {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("role", roleKey.toLowerCase());
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|milk3.png).*)"],
};
