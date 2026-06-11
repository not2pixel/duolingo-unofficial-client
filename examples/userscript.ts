import { DuolingoClient, type DuolingoTransport, type TransportRequest, type TransportResponse } from "../src";

interface GmResponse {
  status: number;
  responseText: string;
  responseHeaders?: string;
}

declare function GM_xmlhttpRequest(options: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
  onload(response: GmResponse): void;
  onerror(error: unknown): void;
  ontimeout(): void;
}): void;

function parseHeaders(raw = ""): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index > 0) headers[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim();
  }
  return headers;
}

class GmXmlHttpTransport implements DuolingoTransport {
  request<T>(request: TransportRequest): Promise<TransportResponse<T>> {
    return new Promise((resolve, reject) => {
      const options: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        data?: string;
        timeout: number;
        onload(response: GmResponse): void;
        onerror(error: unknown): void;
        ontimeout(): void;
      } = {
        method: request.method,
        url: request.url,
        timeout: 15000,
        onload: (response) => {
          try {
            const data = response.responseText ? (JSON.parse(response.responseText) as T) : (null as T);
            resolve({
              status: response.status,
              headers: parseHeaders(response.responseHeaders),
              data
            });
          } catch (error) {
            reject(error);
          }
        },
        onerror: reject,
        ontimeout: () => reject(new Error("Request timed out"))
      };
      if (request.headers !== undefined) options.headers = request.headers;
      if (request.body !== undefined) options.data = JSON.stringify(request.body);
      GM_xmlhttpRequest(options);
    });
  }
}

const client = new DuolingoClient({
  tokenProvider: async () => null,
  transport: new GmXmlHttpTransport()
});

console.log(await client.auth.getTokenInformation());
