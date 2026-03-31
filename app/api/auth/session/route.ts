import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_KEYS } from "@/lib/auth/session-keys";
import { createSessionSignature } from "@/lib/auth/server-session-signature";

const COOKIE_SECURITY_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseValidDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const session = payload as Record<string, unknown>;

  const token = session.token;
  const expiresAt = session.expiresAt;
  const refreshToken = session.refreshToken;
  const refreshTokenExpiresAt = session.refreshTokenExpiresAt;
  const tenantId = session.tenantId;

  if (
    !isNonEmptyString(token) ||
    !isNonEmptyString(expiresAt) ||
    !isNonEmptyString(refreshToken) ||
    !isNonEmptyString(refreshTokenExpiresAt) ||
    !isNonEmptyString(tenantId)
  ) {
    return NextResponse.json({ message: "Sessao invalida." }, { status: 400 });
  }

  const tokenExpiresDate = parseValidDate(expiresAt);
  const refreshTokenExpiresDate = parseValidDate(refreshTokenExpiresAt);

  if (!tokenExpiresDate || !refreshTokenExpiresDate) {
    return NextResponse.json({ message: "Datas de expiracao invalidas." }, { status: 400 });
  }

  const response = new NextResponse(null, { status: 204 });
  const signature = await createSessionSignature({
    token,
    expiresAt,
    refreshToken,
    refreshTokenExpiresAt,
    tenantId
  });

  response.cookies.set(AUTH_COOKIE_KEYS.token, token, {
    ...COOKIE_SECURITY_OPTIONS,
    expires: tokenExpiresDate
  });
  response.cookies.set(AUTH_COOKIE_KEYS.expiresAt, expiresAt, {
    ...COOKIE_SECURITY_OPTIONS,
    expires: tokenExpiresDate
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshToken, refreshToken, {
    ...COOKIE_SECURITY_OPTIONS,
    expires: refreshTokenExpiresDate
  });
  response.cookies.set(AUTH_COOKIE_KEYS.refreshTokenExpiresAt, refreshTokenExpiresAt, {
    ...COOKIE_SECURITY_OPTIONS,
    expires: refreshTokenExpiresDate
  });
  response.cookies.set(AUTH_COOKIE_KEYS.tenantId, tenantId, {
    ...COOKIE_SECURITY_OPTIONS,
    expires: refreshTokenExpiresDate
  });
  response.cookies.set(AUTH_COOKIE_KEYS.signature, signature, {
    ...COOKIE_SECURITY_OPTIONS,
    expires: refreshTokenExpiresDate
  });

  return response;
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
}
