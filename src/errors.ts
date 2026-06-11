export interface DuolingoErrorDetails {
  status?: number;
  method?: string;
  endpoint?: string;
  retryAfter?: number;
  cause?: unknown;
}

/** Base error for all package-generated failures. */
export class DuolingoError extends Error {
  readonly status: number | undefined;
  readonly method: string | undefined;
  readonly endpoint: string | undefined;
  readonly retryAfter: number | undefined;
  override readonly cause: unknown | undefined;

  constructor(message: string, details: DuolingoErrorDetails = {}) {
    super(message);
    this.name = new.target.name;
    this.status = details.status;
    this.method = details.method;
    this.endpoint = details.endpoint;
    this.retryAfter = details.retryAfter;
    this.cause = details.cause;
  }
}

export class DuolingoAuthError extends DuolingoError {}
export class DuolingoHttpError extends DuolingoError {}
export class DuolingoParseError extends DuolingoError {}
export class DuolingoRateLimitError extends DuolingoHttpError {}
export class DuolingoConfigurationError extends DuolingoError {}

export function errorForStatus(status: number): typeof DuolingoHttpError {
  if (status === 401 || status === 403) return DuolingoAuthError;
  if (status === 429) return DuolingoRateLimitError;
  return DuolingoHttpError;
}
