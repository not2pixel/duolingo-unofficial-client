export interface NodeLikeResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string | Buffer): void;
}

export async function sendNodeResponse(nodeResponse: NodeLikeResponse, response: Response): Promise<void> {
  nodeResponse.statusCode = response.status;
  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });
  if (!response.body) {
    nodeResponse.end();
    return;
  }
  const body = Buffer.from(await response.arrayBuffer());
  nodeResponse.end(body);
}
