import { SECURITY_HEADERS } from "./security.js";

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export function jsonResponse(data: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}

export function emptyResponse(status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(null, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}

export function errorResponse(status: number, code: string, message: string): Response {
  const body: ApiErrorBody = { ok: false, error: { code, message } };
  return jsonResponse(body, status);
}

export function methodNotAllowedResponse(allowed: string): Response {
  return jsonResponse(
    { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "This endpoint does not support that method." } },
    405,
    { Allow: allowed }
  );
}
