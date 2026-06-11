import { createHash, timingSafeEqual } from "node:crypto";

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store"
} as const;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function timingSafeStringEqual(actual: string, expected: string): boolean {
  const actualDigest = digest(actual);
  const expectedDigest = digest(expected);
  return timingSafeEqual(actualDigest, expectedDigest) && actual.length === expected.length;
}

export function isDemoAccessAllowed(configuredKey: string | undefined, providedKey: string | null): boolean {
  if (!configuredKey) return true;
  if (!providedKey) return false;
  return timingSafeStringEqual(providedKey, configuredKey);
}
