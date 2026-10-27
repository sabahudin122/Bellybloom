import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";

const sessionCookieName =
  process.env.NODE_ENV === "production"
    ? "__Secure-bellybloom.session-token"
    : "bellybloom.session-token";

const authProxy = withAuth({
  pages: { signIn: "/login" },
  cookies: { sessionToken: { name: sessionCookieName } },
});

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return authProxy(request as NextRequestWithAuth, event);
}

export const config = {
  matcher: ["/dashboard/:path*", "/babies/:path*", "/favorites/:path*", "/community/:path*", "/settings/:path*", "/admin/:path*"],
};
