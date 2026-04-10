import { AUTH_COOKIE_KEYS, AUTH_STORAGE_KEYS } from "@/lib/auth/session-keys";
import { normalizePermissions } from "@/lib/auth/permissions";

export { AUTH_COOKIE_KEYS, AUTH_STORAGE_KEYS };

export type AuthUser = {
  userId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: string[];
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tenantId: string;
  user: AuthUser;
};

type SessionCookiePayload = Pick<
  AuthSession,
  "token" | "expiresAt" | "refreshToken" | "refreshTokenExpiresAt" | "tenantId"
> & {
  permissions: string[];
};

const AUTH_SESSION_SYNC_ROUTE = "/api/auth/session";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function canSyncWithServer(): boolean {
  return typeof window !== "undefined" && typeof window.fetch === "function";
}

function writeSessionToStorage(session: AuthSession) {
  if (!canUseStorage()) {
    return;
  }

  const normalizedUser: AuthUser = {
    ...session.user,
    isAdmin: session.user.isAdmin ?? false,
    permissions: normalizePermissions(session.user.permissions ?? [])
  };

  window.localStorage.setItem(AUTH_STORAGE_KEYS.token, session.token);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.expiresAt, session.expiresAt);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshTokenExpiresAt, session.refreshTokenExpiresAt);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.tenantId, session.tenantId);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(normalizedUser));
}

function clearSessionFromStorage() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.expiresAt);
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.refreshTokenExpiresAt);
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.tenantId);
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.user);
}

async function syncSessionCookieWithServer(payload: SessionCookiePayload) {
  if (!canSyncWithServer()) {
    return;
  }

  const response = await window.fetch(AUTH_SESSION_SYNC_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Falha ao sincronizar sessao com o servidor.");
  }
}

async function clearSessionCookieFromServer() {
  if (!canSyncWithServer()) {
    return;
  }

  try {
    await window.fetch(AUTH_SESSION_SYNC_ROUTE, {
      method: "DELETE",
      credentials: "same-origin"
    });
  } catch {
    // Melhor esforco: storage local ja foi limpo.
  }
}

export async function saveAuthSession(session: AuthSession) {
  const normalizedPermissions = normalizePermissions(session.user.permissions ?? []);
  writeSessionToStorage(session);

  try {
    await syncSessionCookieWithServer({
      token: session.token,
      expiresAt: session.expiresAt,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      tenantId: session.tenantId,
      permissions: normalizedPermissions
    });
  } catch (error) {
    clearSessionFromStorage();
    throw error;
  }
}

export async function clearAuthSession() {
  clearSessionFromStorage();
  await clearSessionCookieFromServer();
}

export function getAuthToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEYS.token);
}

export function getAuthExpiresAt(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEYS.expiresAt);
}

export function getAuthRefreshToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
}

export function getAuthRefreshTokenExpiresAt(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEYS.refreshTokenExpiresAt);
}

export function getAuthTenantId(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEYS.tenantId);
}

export function getAuthUser(): AuthUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEYS.user);
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as Partial<AuthUser>;
    if (!parsed || typeof parsed.userId !== "string" || typeof parsed.name !== "string" || typeof parsed.email !== "string") {
      throw new Error("Invalid auth user payload.");
    }

    return {
      userId: parsed.userId,
      name: parsed.name,
      email: parsed.email,
      isAdmin: typeof parsed.isAdmin === "boolean" ? parsed.isAdmin : false,
      permissions: normalizePermissions(
        Array.isArray(parsed.permissions)
          ? parsed.permissions.filter((permission): permission is string => typeof permission === "string")
          : []
      )
    };
  } catch {
    void clearAuthSession();
    return null;
  }
}

export function updateAuthUser(user: AuthUser) {
  if (!canUseStorage()) {
    return;
  }

  const normalizedPermissions = normalizePermissions(user.permissions ?? []);
  window.localStorage.setItem(
    AUTH_STORAGE_KEYS.user,
    JSON.stringify({
      ...user,
      permissions: normalizedPermissions
    } satisfies AuthUser)
  );

  const token = getAuthToken();
  const expiresAt = getAuthExpiresAt();
  const refreshToken = getAuthRefreshToken();
  const refreshTokenExpiresAt = getAuthRefreshTokenExpiresAt();
  const tenantId = getAuthTenantId();

  if (!token || !expiresAt || !refreshToken || !refreshTokenExpiresAt || !tenantId) {
    return;
  }

  void syncSessionCookieWithServer({
    token,
    expiresAt,
    refreshToken,
    refreshTokenExpiresAt,
    tenantId,
    permissions: normalizedPermissions
  }).catch(() => {
    // Melhor esforco: manter sessao local e permitir nova sincronizacao em refresh/login.
  });
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

export function isTokenExpired(referenceDate = new Date()): boolean {
  return isDateExpired(getAuthExpiresAt(), referenceDate);
}

export function isRefreshTokenExpired(referenceDate = new Date()): boolean {
  return isDateExpired(getAuthRefreshTokenExpiresAt(), referenceDate);
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  if (!isTokenExpired()) {
    return true;
  }

  const refreshToken = getAuthRefreshToken();
  return Boolean(refreshToken) && !isRefreshTokenExpired();
}

export function getValidToken(): string | null {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  if (isTokenExpired()) {
    return null;
  }

  return token;
}
