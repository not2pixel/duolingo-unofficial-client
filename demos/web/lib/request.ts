export interface NodeLikeRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export type DemoRequest = Request | NodeLikeRequest;

export function getMethod(request: DemoRequest): string {
  return request.method ?? "GET";
}

export function getHeader(request: DemoRequest, name: string): string | null {
  if (request.headers instanceof Headers) return request.headers.get(name);
  const headers = request.headers;
  if (!headers) return null;
  const value = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
