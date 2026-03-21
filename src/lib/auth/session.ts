export const AUTH_STORAGE_KEYS = {
  token: "auth_token",
  expiresAt: "auth_expires_at",
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
  window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user));
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.expiresAt);
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

export function isTokenExpired(referenceDate = new Date()): boolean {
  const expiresAt = getAuthExpiresAt();
  if (!expiresAt) {
    return true;
  }

  const expiresDate = new Date(expiresAt);
  if (Number.isNaN(expiresDate.getTime())) {
    return true;
  }

  return expiresDate <= referenceDate;
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  return !isTokenExpired();
}

export function getValidToken(): string | null {
  if (!isAuthenticated()) {
    clearAuthSession();
    return null;
  }

  return getAuthToken();
}
