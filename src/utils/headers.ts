export function buildJsonHeaders(token?: string, extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...extraHeaders
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}

export function buildGoalHeaders(token: string): Record<string, string> {
  return buildJsonHeaders(token, {
    accept: "application/json; charset=UTF-8",
    "x-requested-with": "XMLHttpRequest"
  });
}

export function redactHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = key.toLowerCase() === "authorization" ? "[REDACTED]" : value;
  }
  return redacted;
}
