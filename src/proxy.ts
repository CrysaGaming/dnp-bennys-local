import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { isPublicPath } from "@/lib/public-paths";

/**
 * Optimischer Cookie-Check (Spec 3.2): keine DB-Abfragen hier, der Proxy läuft
 * bei jedem Request und Prefetch. Er leitet nie von `/login` weg – sonst entsteht
 * mit einem abgelaufenen Cookie eine Redirect-Schleife.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|mp3|ogg|wav|woff2|woff|css|js)).*)",
  ],
};
