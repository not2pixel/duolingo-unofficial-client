import { describe, expect, it } from "vitest";
import { handleHealthRequest } from "../api/health.js";

describe("/api/health", () => {
  it("returns health JSON for GET", async () => {
    const response = handleHealthRequest(new Request("https://demo.test/api/health"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, service: "duolingo-client-demo" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("supports HEAD without contacting Duolingo", async () => {
    const response = handleHealthRequest(new Request("https://demo.test/api/health", { method: "HEAD" }));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  it("returns 405 with Allow for unsupported methods", async () => {
    const response = handleHealthRequest(new Request("https://demo.test/api/health", { method: "POST" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
  });

  it("sets security headers", () => {
    const response = handleHealthRequest(new Request("https://demo.test/api/health"));
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
});
