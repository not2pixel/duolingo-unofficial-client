import type { DuolingoTransport, TransportRequest, TransportResponse } from "@duohacker/duolingo";

export interface GmXmlHttpResponse {
  status: number;
  responseText: string;
  responseHeaders?: string;
}

export interface GmXmlHttpRequestHandle {
  abort?: () => void;
}

export type GmXmlHttpRequest = (options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
  onload(response: GmXmlHttpResponse): void;
  onerror(error: unknown): void;
  ontimeout(): void;
  onabort?: () => void;
}) => GmXmlHttpRequestHandle | void;

export function parseGmHeaders(raw = ""): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index <= 0) continue;
    headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
  }
  return headers;
}

function parseJsonResponse(text: string, url: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const host = new URL(url).host;
    throw new Error(`Invalid JSON response from ${host}`, { cause: error });
  }
}

export class GmTransport implements DuolingoTransport {
  constructor(private readonly gmXmlHttpRequest: GmXmlHttpRequest) {}

  request<T>(request: TransportRequest): Promise<TransportResponse<T>> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      const options: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        data?: string;
        timeout: number;
        onload(response: GmXmlHttpResponse): void;
        onerror(error: unknown): void;
        ontimeout(): void;
        onabort(): void;
      } = {
        method: request.method,
        url: request.url,
        timeout: 15000,
        onload: (response) => {
          if (settled) return;
          try {
            settled = true;
            resolve({
              status: response.status,
              headers: parseGmHeaders(response.responseHeaders),
              data: parseJsonResponse(response.responseText, request.url) as T
            });
          } catch (error) {
            reject(error);
          }
        },
        onerror: () => rejectOnce(new Error("Network request failed")),
        ontimeout: () => rejectOnce(new Error("Request timed out")),
        onabort: () => rejectOnce(new Error("Request was aborted"))
      };
      if (request.headers !== undefined) options.headers = request.headers;
      if (request.body !== undefined) options.data = JSON.stringify(request.body);

      const handle = this.gmXmlHttpRequest(options);

      if (request.signal) {
        if (request.signal.aborted) {
          handle?.abort?.();
          rejectOnce(new Error("Request was aborted"));
          return;
        }
        request.signal.addEventListener(
          "abort",
          () => {
            handle?.abort?.();
            rejectOnce(new Error("Request was aborted"));
          },
          { once: true }
        );
      }
    });
  }
}
