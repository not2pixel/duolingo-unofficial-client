import { DuolingoAuthError } from "../errors";
import type { TokenProvider } from "./types";

export interface TokenResolverOptions {
  token?: string;
  tokenProvider?: TokenProvider;
}

export class TokenResolver {
  readonly #token: string | undefined;
  readonly #tokenProvider: TokenProvider | undefined;

  constructor(options: TokenResolverOptions) {
    this.#token = options.token;
    this.#tokenProvider = options.tokenProvider;
  }

  async requireToken(): Promise<string> {
    const token = this.#token ?? (await this.#tokenProvider?.());
    if (!token) {
      throw new DuolingoAuthError("A Duolingo JWT is required for this request");
    }
    return token;
  }

  async getToken(): Promise<string | null> {
    return this.#token ?? (await this.#tokenProvider?.()) ?? null;
  }
}
