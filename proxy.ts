import { NextRequest, NextResponse } from "next/server";

import { canAccessPath, getFirstAccessiblePath, normalizePermissions } from "@/lib/auth/permissions";
import { AUTH_COOKIE_KEYS } from "@/lib/auth/session-keys";
import { isValidSessionSignature } from "@/lib/auth/server-session-signature";

const LOGIN_ROUTE = "/login";
const PUBLIC_ROUTES = new Set([LOGIN_ROUTE, "/esqueci-senha", "/criar-conta", "/redefinir-senha"]);
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

type SessionValidationResult = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  permissions: string[];
};

function parseBooleanClaim(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

function getAdminClaimFromToken(token: string): boolean {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return false;
    const payload = JSON.parse(
      atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"))
    ) as Record<string, unknown>;

    return parseBooleanClaim(payload.is_admin) === true;
  } catch {
    return false;
  }
}

function parsePermissionsCookie(rawPermissions: string | null): string[] | null {
  if (!rawPermissions) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawPermissions) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    return normalizePermissions(parsed.filter((permission): permission is string => typeof permission === "string"));
  } catch {
    return null;
  }
}

async function validateSession(request: NextRequest): Promise<SessionValidationResult> {
  const token = request.cookies.get(AUTH_COOKIE_KEYS.token)?.value ?? null;
  const tokenExpiresAt = request.cookies.get(AUTH_COOKIE_KEYS.expiresAt)?.value ?? null;
  const refreshToken = request.cookies.get(AUTH_COOKIE_KEYS.refreshToken)?.value ?? null;
  const refreshTokenExpiresAt =
    request.cookies.get(AUTH_COOKIE_KEYS.refreshTokenExpiresAt)?.value ?? null;
  const tenantId = request.cookies.get(AUTH_COOKIE_KEYS.tenantId)?.value ?? null;
  const rawPermissions = request.cookies.get(AUTH_COOKIE_KEYS.permissions)?.value ?? null;
  const signature = request.cookies.get(AUTH_COOKIE_KEYS.signature)?.value ?? null;
  const permissions = parsePermissionsCookie(rawPermissions);

  if (!token || !tokenExpiresAt || !refreshToken || !refreshTokenExpiresAt || !tenantId || !signature || !permissions) {
    return { isAuthenticated: false, isAdmin: false, permissions: [] };
  }

  const isAdmin = getAdminClaimFromToken(token);

  const signatureIsValid = await isValidSessionSignature(
    {
      token,
      expiresAt: tokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      tenantId,
      permissions
    },
    signature
  );

  if (!signatureIsValid) {
    return { isAuthenticated: false, isAdmin: false, permissions: [] };
  }

  if (!isDateExpired(tokenExpiresAt)) {
    return { isAuthenticated: true, isAdmin, permissions };
  }

  return {
    isAuthenticated: Boolean(refreshToken) && Boolean(tenantId) && !isDateExpired(refreshTokenExpiresAt),
    isAdmin,
    permissions
  };
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
  response.cookies.set(AUTH_COOKIE_KEYS.permissions, "", {
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
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const session = await validateSession(request);
  const isAuthenticated = session.isAuthenticated;

  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    }

    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  if (!isPublicRoute && isAuthenticated && !session.isAdmin && !canAccessPath(pathname, session.permissions)) {
    const fallbackPath = getFirstAccessiblePath(session.permissions);
    return NextResponse.redirect(new URL(fallbackPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"]
};
