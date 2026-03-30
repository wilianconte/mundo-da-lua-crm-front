export const AUTH_STORAGE_KEYS = {
  token: "auth_token",
  expiresAt: "auth_expires_at",
  refreshToken: "auth_refresh_token",
  refreshTokenExpiresAt: "auth_refresh_expires_at",
  tenantId: "auth_tenant_id",
  user: "auth_user"
} as const;

export type AuthUser = {
  userId: string;
  name: string;
  email: string;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tenantId: string;
  user: AuthUser;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveAuthSession(session: AuthSession) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEYS.token, session.token);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.expiresAt, session.expiresAt);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshTokenExpiresAt, session.refreshTokenExpiresAt);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.tenantId, session.tenantId);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user));
}

export function clearAuthSession() {
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
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
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
