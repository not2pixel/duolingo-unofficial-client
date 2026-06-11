export { DuolingoClient } from "./client";
export type { DuolingoClientConfig, DuolingoBaseUrls } from "./config";
export type { DuolingoRequestOptions } from "./client";
export {
  DuolingoAuthError,
  DuolingoConfigurationError,
  DuolingoError,
  DuolingoHttpError,
  DuolingoParseError,
  DuolingoRateLimitError
} from "./errors";
export { decodeJwt, getTokenInformation } from "./auth/decode-jwt";
export type { DecodedJwtPayload, DuolingoTokenInformation, TokenProvider } from "./auth/types";
export { FetchTransport } from "./transport/fetch-transport";
export type { DuolingoTransport } from "./transport/transport";
export type { TransportMethod, TransportRequest, TransportResponse } from "./transport/types";
export { redactHeaders } from "./utils/headers";
export type {
  DuolingoCourse,
  DuolingoGoalDefinition,
  DuolingoGoalProgress,
  DuolingoGoalSchema,
  DuolingoLeaderboard,
  DuolingoLeaderboardEntry,
  DuolingoShopItem,
  DuolingoUser
} from "./types";
