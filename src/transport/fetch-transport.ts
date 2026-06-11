import { DuolingoError, DuolingoParseError } from "../errors";
import type { DuolingoTransport } from "./transport";
import type { TransportRequest, TransportResponse } from "./types";

function stringifyBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export class FetchTransport implements DuolingoTransport {
  async request<T>(request: TransportRequest): Promise<TransportResponse<T>> {
    let response: Response;
    try {
      const init: RequestInit = {
        method: request.method,
      };
      if (request.headers !== undefined) init.headers = request.headers;
      if (request.body !== undefined && request.body !== null) {
        const body = stringifyBody(request.body);
        if (body !== undefined) init.body = body;
      }
      if (request.signal !== undefined) init.signal = request.signal;
      response = await fetch(request.url, init);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new DuolingoError("Request was aborted", {
          method: request.method,
          endpoint: request.url,
          cause: error
        });
      }
      throw new DuolingoError("Network request failed", {
        method: request.method,
        endpoint: request.url,
        cause: error
      });
    }

    const text = await response.text();
    let data: unknown = null;
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new DuolingoParseError("Invalid JSON response", {
          status: response.status,
          method: request.method,
          endpoint: request.url,
          cause: error
        });
      }
    }

    return {
      status: response.status,
      headers: headersToRecord(response.headers),
      data: data as T
    };
  }
}
