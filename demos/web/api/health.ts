import { emptyResponse, jsonResponse, methodNotAllowedResponse } from "../lib/responses.js";
import { getMethod, type DemoRequest } from "../lib/request.js";
import { sendNodeResponse, type NodeLikeResponse } from "../lib/vercel-node.js";

export function handleHealthRequest(request: DemoRequest): Response {
  const method = getMethod(request);
  if (method === "HEAD") return emptyResponse(200);
  if (method !== "GET") return methodNotAllowedResponse("GET, HEAD");

  return jsonResponse({
    ok: true,
    service: "duolingo-client-demo"
  });
}

export default async function handler(request: DemoRequest, response?: NodeLikeResponse): Promise<Response | void> {
  const result = handleHealthRequest(request);
  if (response) return sendNodeResponse(response, result);
  return result;
}
