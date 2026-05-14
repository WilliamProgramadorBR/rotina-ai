const FORBIDDEN_SECRETS = new Set([
  "dev-secret",
  "change-me",
  "changeme",
  "secret",
  "jwt-secret"
]);

export const MIN_SECRET_LENGTH = 32;

function getRequiredSecret(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} precisa estar configurado no .env.`);
  }

  validateSecret(name, value);

  return value;
}

function getOptionalSecret(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  validateSecret(name, value);

  return value;
}

function validateSecret(name: string, value: string) {

  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} precisa ter pelo menos ${MIN_SECRET_LENGTH} caracteres.`);
  }

  if (FORBIDDEN_SECRETS.has(value.toLowerCase())) {
    throw new Error(`${name} ainda esta usando um valor de desenvolvimento.`);
  }
}

export const jwtSecret = getRequiredSecret("JWT_SECRET");
const configuredDataEncryptionSecret = getOptionalSecret("DATA_ENCRYPTION_KEY");
export const dataEncryptionSecret = configuredDataEncryptionSecret || jwtSecret;
export const isUsingJwtSecretForDataEncryption = !configuredDataEncryptionSecret;

export const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};

const DEFAULT_ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1"
]);

function configuredOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function isLocalOrigin(url: URL) {
  return DEFAULT_ALLOWED_HOSTS.has(url.hostname);
}

function isTunnelOrigin(url: URL) {
  return url.protocol === "https:" && url.hostname.endsWith(".trycloudflare.com");
}

export function isCorsOriginAllowed(origin?: string) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = origin.replace(/\/+$/, "");
  const allowedOrigins = configuredOrigins();

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const url = new URL(normalizedOrigin);
    return isLocalOrigin(url) || isTunnelOrigin(url);
  } catch {
    return false;
  }
}
