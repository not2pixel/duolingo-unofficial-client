export type TransportMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface TransportRequest {
  method: TransportMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export interface TransportResponse<T> {
  status: number;
  headers: Record<string, string>;
  data: T;
}
