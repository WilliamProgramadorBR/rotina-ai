import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { dataEncryptionSecret } from "../config/security";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENCRYPTION_PREFIX = "enc:v1:";

const encryptionKey = createHash("sha256")
  .update(`rotina-ai:data:${dataEncryptionSecret}`)
  .digest();

function encode(value: Buffer) {
  return value.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

export function isEncryptedValue(value: unknown) {
  return typeof value === "string" && value.startsWith(ENCRYPTION_PREFIX);
}

export function encryptText<T extends string | null | undefined>(value: T): T {
  if (typeof value !== "string" || value.length === 0 || isEncryptedValue(value)) {
    return value;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: TAG_LENGTH
  });
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${encode(iv)}.${encode(tag)}.${encode(encrypted)}` as T;
}

export function decryptText<T extends string | null | undefined>(value: T): T {
  if (typeof value !== "string" || value.length === 0 || !isEncryptedValue(value)) {
    return value;
  }

  const encryptedPayload = value.slice(ENCRYPTION_PREFIX.length);
  const [ivText, tagText, encryptedText] = encryptedPayload.split(".");

  if (!ivText || !tagText || !encryptedText) {
    throw new Error("Campo criptografado esta em formato invalido.");
  }

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, decode(ivText), {
    authTagLength: TAG_LENGTH
  });
  decipher.setAuthTag(decode(tagText));

  const decrypted = Buffer.concat([
    decipher.update(decode(encryptedText)),
    decipher.final()
  ]);

  return decrypted.toString("utf8") as T;
}
