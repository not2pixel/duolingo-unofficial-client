import { DuolingoAuthError } from "../errors";
import type { DecodedJwtPayload, DuolingoTokenInformation } from "./types";

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(padded, "base64").toString("utf8");
}

function dateFromSeconds(value: unknown): Date | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000) : null;
}

/**
 * Decodes a JWT payload without verifying its signature.
 *
 * This helper is only for reading claims such as `sub`; it does not prove that
 * the token is authentic or unmodified.
 */
export function decodeJwt(token: string): DecodedJwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new DuolingoAuthError("Invalid JWT structure");
  }

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(parts[1]));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new DuolingoAuthError("Invalid JWT payload");
    }
    return parsed as DecodedJwtPayload;
  } catch (error) {
    if (error instanceof DuolingoAuthError) throw error;
    throw new DuolingoAuthError("Invalid JWT payload", { cause: error });
  }
}

export function getTokenInformation(token: string): DuolingoTokenInformation {
  const payload = decodeJwt(token);
  return {
    subject: typeof payload.sub === "string" ? payload.sub : null,
    issuer: typeof payload.iss === "string" ? payload.iss : null,
    audience:
      typeof payload.aud === "string" || Array.isArray(payload.aud)
        ? payload.aud
        : null,
    issuedAt: dateFromSeconds(payload.iat),
    expiresAt: dateFromSeconds(payload.exp),
    payload
  };
}
