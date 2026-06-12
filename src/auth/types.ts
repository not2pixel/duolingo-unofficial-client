export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export interface DecodedJwtPayload {
  sub?: string | number;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [claim: string]: unknown;
}

export interface DuolingoTokenInformation {
  /** JWT subject claim, commonly the Duolingo user id. */
  subject: string | null;
  issuer: string | null;
  audience: string | string[] | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  payload: Readonly<DecodedJwtPayload>;
}
