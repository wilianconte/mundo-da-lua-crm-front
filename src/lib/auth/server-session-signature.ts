const FALLBACK_AUTH_GATE_SECRET = "mdl-crm-auth-gate-dev-secret";

type SessionSignatureInput = {
  token: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tenantId: string;
};

function getAuthGateSecret(): string {
  const configuredSecret = process.env.AUTH_GATE_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_GATE_SECRET (ou NEXTAUTH_SECRET) deve estar definido em producao.");
  }

  return FALLBACK_AUTH_GATE_SECRET;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fixedTimeEquals(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function serializeSession(input: SessionSignatureInput): string {
  return [
    input.token,
    input.expiresAt,
    input.refreshToken,
    input.refreshTokenExpiresAt,
    input.tenantId
  ].join("\u001f");
}

export async function createSessionSignature(input: SessionSignatureInput): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthGateSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const message = new TextEncoder().encode(serializeSession(input));
  const signature = await crypto.subtle.sign("HMAC", key, message);

  return toHex(new Uint8Array(signature));
}

export async function isValidSessionSignature(
  input: SessionSignatureInput,
  signature: string
): Promise<boolean> {
  const expectedSignature = await createSessionSignature(input);
  return fixedTimeEquals(expectedSignature, signature);
}
