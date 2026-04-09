export const AUTH_STORAGE_KEYS = {
  token: "auth_token",
  expiresAt: "auth_expires_at",
  refreshToken: "auth_refresh_token",
  refreshTokenExpiresAt: "auth_refresh_expires_at",
  tenantId: "auth_tenant_id",
  user: "auth_user"
} as const;

export const AUTH_COOKIE_KEYS = {
  token: AUTH_STORAGE_KEYS.token,
  expiresAt: AUTH_STORAGE_KEYS.expiresAt,
  refreshToken: AUTH_STORAGE_KEYS.refreshToken,
  refreshTokenExpiresAt: AUTH_STORAGE_KEYS.refreshTokenExpiresAt,
  tenantId: AUTH_STORAGE_KEYS.tenantId,
  permissions: "auth_permissions",
  signature: "auth_session_sig"
} as const;
