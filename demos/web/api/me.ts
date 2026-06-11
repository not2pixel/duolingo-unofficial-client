import {
  DuolingoAuthError,
  DuolingoClient,
  DuolingoError,
  DuolingoHttpError,
  DuolingoParseError,
  DuolingoRateLimitError,
  type DuolingoUser
} from "@duohacker/duolingo";
import { getDemoConfig, type DemoConfig } from "../lib/auth.js";
import { getHeader, getMethod, type DemoRequest } from "../lib/request.js";
import { emptyResponse, errorResponse, jsonResponse, methodNotAllowedResponse } from "../lib/responses.js";
import { sanitizeUser } from "../lib/sanitize-user.js";
import { isDemoAccessAllowed } from "../lib/security.js";
import { sendNodeResponse, type NodeLikeResponse } from "../lib/vercel-node.js";

interface DemoClient {
  users: {
    getCurrent(): Promise<DuolingoUser>;
  };
}

export interface MeHandlerOptions {
  config?: DemoConfig;
  clientFactory?: (token: string) => DemoClient;
}

function mapError(error: unknown): Response {
  if (error instanceof DuolingoRateLimitError) {
    return errorResponse(429, "RATE_LIMITED", "Duolingo rate-limited the request. Try again later.");
  }
  if (error instanceof DuolingoAuthError) {
    return errorResponse(502, "AUTHENTICATION_FAILED", "Unable to load the Duolingo profile.");
  }
  if (error instanceof DuolingoParseError) {
    return errorResponse(502, "UPSTREAM_RESPONSE_INVALID", "Duolingo returned an unexpected response.");
  }
  if (error instanceof DuolingoHttpError && typeof error.status === "number" && error.status >= 500) {
    return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Duolingo is temporarily unavailable.");
  }
  if (error instanceof DuolingoError) {
    return errorResponse(502, "UPSTREAM_FAILED", "Unable to load the Duolingo profile.");
  }
  return errorResponse(503, "UPSTREAM_UNAVAILABLE", "Unable to load the Duolingo profile.");
}

export async function handleMeRequest(request: DemoRequest, options: MeHandlerOptions = {}): Promise<Response> {
  const method = getMethod(request);
  if (method === "HEAD") return emptyResponse(200);
  if (method !== "GET") return methodNotAllowedResponse("GET, HEAD");

  const config = options.config ?? getDemoConfig();
  if (!isDemoAccessAllowed(config.demoAccessKey, getHeader(request, "x-demo-access-key"))) {
    return errorResponse(401, "INVALID_DEMO_ACCESS_KEY", "The demo access key is missing or invalid.");
  }
  if (!config.duolingoToken) {
    return errorResponse(500, "SERVER_CONFIGURATION_MISSING", "The demo server is missing required configuration.");
  }

  try {
    const client = options.clientFactory?.(config.duolingoToken) ?? new DuolingoClient({ token: config.duolingoToken });
    const user = await client.users.getCurrent();
    return jsonResponse(sanitizeUser(user));
  } catch (error) {
    return mapError(error);
  }
}

export default async function handler(request: DemoRequest, response?: NodeLikeResponse): Promise<Response | void> {
  const result = await handleMeRequest(request);
  if (response) return sendNodeResponse(response, result);
  return result;
}
