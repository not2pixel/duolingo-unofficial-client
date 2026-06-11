import { getTokenInformation } from "./auth/decode-jwt";
import { TokenResolver } from "./auth/token-provider";
import type { DuolingoTokenInformation } from "./auth/types";
import { allowedOrigins, DEFAULT_BASE_URLS, normalizeBaseUrls, type DuolingoBaseUrls, type DuolingoClientConfig } from "./config";
import { DuolingoAuthError, DuolingoConfigurationError, DuolingoParseError, errorForStatus } from "./errors";
import { CoursesModule } from "./modules/courses";
import { GoalsModule } from "./modules/goals";
import { LeaderboardsModule } from "./modules/leaderboards";
import { ShopModule } from "./modules/shop";
import { UsersModule } from "./modules/users";
import { FetchTransport } from "./transport/fetch-transport";
import type { DuolingoTransport } from "./transport/transport";
import type { TransportMethod } from "./transport/types";
import { buildJsonHeaders } from "./utils/headers";

export interface DuolingoRequestOptions {
  method: TransportMethod;
  /** Relative API path, or an absolute URL on an allowlisted Duolingo host. */
  path: string;
  /** Base URL used for relative paths. Defaults to `web`. */
  baseUrl?: keyof DuolingoBaseUrls;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  /** Defaults to true. Set false only for endpoints that do not require a JWT. */
  authenticated?: boolean;
}

class AuthModule {
  constructor(private readonly tokenResolver: TokenResolver) {}

  /** Decodes the configured JWT claims without verifying the JWT signature. */
  async getTokenInformation(): Promise<DuolingoTokenInformation> {
    const token = await this.tokenResolver.requireToken();
    return getTokenInformation(token);
  }
}

/**
 * Unofficial client for selected Duolingo web API endpoints.
 *
 * High-level modules are read-only in version 0.1.0.
 */
export class DuolingoClient {
  readonly auth: AuthModule;
  readonly users: UsersModule;
  readonly leaderboards: LeaderboardsModule;
  readonly goals: GoalsModule;
  readonly shop: ShopModule;
  readonly courses: CoursesModule;

  readonly #transport: DuolingoTransport;
  readonly #baseUrls: DuolingoBaseUrls;
  readonly #allowedOrigins: Set<string>;
  readonly #tokenResolver: TokenResolver;

  constructor(config: DuolingoClientConfig = {}) {
    this.#baseUrls = normalizeBaseUrls(config.baseUrls);
    this.#allowedOrigins = allowedOrigins(this.#baseUrls);
    this.#transport = config.transport ?? new FetchTransport();
    const tokenOptions: { token?: string; tokenProvider?: typeof config.tokenProvider } = {};
    if (config.token !== undefined) tokenOptions.token = config.token;
    if (config.tokenProvider !== undefined) tokenOptions.tokenProvider = config.tokenProvider;
    this.#tokenResolver = new TokenResolver(tokenOptions);

    this.auth = new AuthModule(this.#tokenResolver);
    this.users = new UsersModule(this);
    this.leaderboards = new LeaderboardsModule(this);
    this.goals = new GoalsModule(this);
    this.shop = new ShopModule(this);
    this.courses = new CoursesModule(this);
  }

  /** Resolved base URLs currently used by the client. */
  get baseUrls(): Readonly<DuolingoBaseUrls> {
    return this.#baseUrls;
  }

  /**
   * Low-level request helper for Duolingo API paths.
   *
   * This method is intentionally narrow: absolute URLs must use https and match
   * a configured Duolingo API origin. Authorization headers are never sent to
   * arbitrary hosts.
   */
  async request<T = unknown>(options: DuolingoRequestOptions): Promise<T> {
    const url = this.#resolveUrl(options.path, options.baseUrl ?? "web");
    const authenticated = options.authenticated ?? true;
    const hasAuthorizationHeader = Object.keys(options.headers ?? {}).some((key) => key.toLowerCase() === "authorization");

    if (!this.#allowedOrigins.has(url.origin)) {
      if (authenticated || hasAuthorizationHeader) {
        throw new DuolingoConfigurationError("Refusing to send credentials to a non-allowlisted host", {
          method: options.method,
          endpoint: this.#sanitizeUrl(url)
        });
      }
      throw new DuolingoConfigurationError("Refusing to request a non-allowlisted host", {
        method: options.method,
        endpoint: this.#sanitizeUrl(url)
      });
    }

    const token = authenticated ? await this.#tokenResolver.requireToken() : undefined;
    const headers = buildJsonHeaders(token, options.headers);
    const transportRequest: {
      method: TransportMethod;
      url: string;
      headers: Record<string, string>;
      body?: unknown;
      signal?: AbortSignal;
    } = {
      method: options.method,
      url: url.toString(),
      headers
    };
    if (options.body !== undefined) transportRequest.body = options.body;
    if (options.signal !== undefined) transportRequest.signal = options.signal;

    const response = await this.#transport.request<unknown>(transportRequest);

    if (response.status < 200 || response.status >= 300) {
      const ErrorClass = errorForStatus(response.status);
      const retryAfter = Number(response.headers["retry-after"]);
      const details: {
        status: number;
        method: TransportMethod;
        endpoint: string;
        retryAfter?: number;
      } = {
        status: response.status,
        method: options.method,
        endpoint: this.#sanitizeUrl(url)
      };
      if (Number.isFinite(retryAfter)) details.retryAfter = retryAfter;
      throw new ErrorClass(`Duolingo API request failed with status ${response.status}`, details);
    }

    return response.data as T;
  }

  async requireCurrentUserId(): Promise<string> {
    const token = await this.#tokenResolver.requireToken();
    const info = getTokenInformation(token);
    if (!info.subject) {
      throw new DuolingoAuthError("JWT payload does not contain a subject");
    }
    return info.subject;
  }

  /** @internal */
  async authTokenForInternalUse(): Promise<string> {
    return this.#tokenResolver.requireToken();
  }

  parseSchema<T>(mapper: (input: unknown) => T, input: unknown, endpoint: string): T {
    try {
      return mapper(input);
    } catch (error) {
      throw new DuolingoParseError("Duolingo API response did not match the expected schema", {
        endpoint,
        cause: error
      });
    }
  }

  #resolveUrl(path: string, baseUrl: keyof DuolingoBaseUrls): URL {
    let url: URL;
    try {
      url = /^https?:\/\//i.test(path) ? new URL(path) : new URL(path, this.#baseUrls[baseUrl]);
    } catch (error) {
      throw new DuolingoConfigurationError("Invalid request URL", { cause: error });
    }

    if (url.protocol !== "https:") {
      throw new DuolingoConfigurationError("Only https URLs are supported", {
        endpoint: this.#sanitizeUrl(url)
      });
    }

    return url;
  }

  #sanitizeUrl(url: URL): string {
    const defaultOrigins = allowedOrigins(DEFAULT_BASE_URLS);
    const hostLabel = defaultOrigins.has(url.origin) || this.#allowedOrigins.has(url.origin) ? url.origin : "[non-allowlisted-origin]";
    return `${hostLabel}${url.pathname}${url.search}`;
  }
}
