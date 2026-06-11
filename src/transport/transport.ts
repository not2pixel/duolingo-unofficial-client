import type { TransportRequest, TransportResponse } from "./types";

export interface DuolingoTransport {
  request<T>(request: TransportRequest): Promise<TransportResponse<T>>;
}
