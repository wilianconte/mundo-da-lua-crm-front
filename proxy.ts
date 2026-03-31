import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_KEYS } from "@/lib/auth/session-keys";
import { isValidSessionSignature } from "@/lib/auth/server-session-signature";

const LOGIN_ROUTE = "/login";
const COOKIE_SECURITY_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function isDateExpired(rawDate: string | null, referenceDate = new Date()) {
  if (!rawDate) {
    return true;
  }

  const expiresDate = new Date(rawDate);
  if (Number.isNaN(expiresDate.getTime())) {
    return true;
  }

  return expiresDate <= referenceDate;
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_KEYS.token)?.value ?? null;
  const tokenExpiresAt = request.cookies.get(AUTH_COOKIE_KEYS.expiresAt)?.value ?? null;
  const refreshToken = request.cookies.get(AUTH_COOKIE_KEYS.refreshToken)?.value ?? null;
  const refreshTokenExpiresAt =
    request.cookies.get(AUTH_COOKIE_KEYS.refreshTokenExpiresAt)?.value ?? null;
  const tenantId = request.cookies.get(AUTH_COOKIE_KEYS.tenantId)?.value ?? null;
  const signature = request.cookies.get(AUTH_COOKIE_KEYS.signature)?.value ?? null;

  if (!token || !tokenExpiresAt || !refreshToken || !refreshTokenExpiresAt || !tenantId || !signature) {
    return false;
  }

  const signatureIsValid = await isValidSessionSignature(
    {
      token,
      expiresAt: tokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      tenantId
    },
    signature
  );

  if (!signatureIsValid) {
    return false;
  }

  if (!isDateExpired(tokenExpiresAt)) {
    return true;
  }

  return Boolean(refreshToken) && Boolean(tenantId) && !isDateExpired(refreshTokenExpiresAt);
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_KEYS.token, "", {
    ...COOKIE_SECURITY_OPTIONS,
    expires: new Date(0)
  });
  response.cookies.set(AUTH_COOKIE_KEYS.expiresAt, "", {
    ...COOKIE_SECURITY_OPTIONS,
    expires: new Date(0)
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, "", {
    ...COOKIE_SECURITY_OPTIONS,
    expires: new Date(0)
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshTokenExpiresAt, "", {
    ...COOKIE_SECURITY_OPTIONS,
    expires: new Date(0)
  });
  response.cookies.set(AUTH_COOKIE_KEYS.tenantId, "", {
    ...COOKIE_SECURITY_OPTIONS,
    expires: new Date(0)
  });
  response.cookies.set(AUTH_COOKIE_KEYS.signature, "", {
    ...COOKIE_SECURITY_OPTIONS,
    expires: new Date(0)
  });
}

export async function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const isLoginRoute = pathname === LOGIN_ROUTE;
  const isAuthenticated = await hasValidSession(request);

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLoginRoute && !isAuthenticated) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    }

    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"]
};
