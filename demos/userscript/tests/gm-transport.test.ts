import { describe, expect, it, vi } from "vitest";
import { GmTransport, type GmXmlHttpRequest } from "../src/gm-transport";
import { createDemoClient, normalizeTokenInput } from "../src/demo.user";

describe("GmTransport", () => {
  it("parses JSON responses and headers", async () => {
    const gm: GmXmlHttpRequest = (options) => {
      options.onload({
        status: 200,
        responseText: JSON.stringify({ ok: true }),
        responseHeaders: "content-type: application/json\r\nretry-after: 1"
      });
    };
    const transport = new GmTransport(gm);
    await expect(transport.request({ method: "GET", url: "https://www.duolingo.com/test" })).resolves.toEqual({
      status: 200,
      headers: { "content-type": "application/json", "retry-after": "1" },
      data: { ok: true }
    });
  });

  it("uses object responses directly when the userscript manager provides them", async () => {
    const gm: GmXmlHttpRequest = (options) => {
      options.onload({
        status: 200,
        response: { ok: true },
        responseHeaders: "content-type: application/json"
      });
    };
    await expect(new GmTransport(gm).request({ method: "GET", url: "https://www.duolingo.com/test" })).resolves.toMatchObject({
      data: { ok: true }
    });
  });

  it("rejects invalid JSON clearly", async () => {
    const gm: GmXmlHttpRequest = (options) => {
      options.onload({ status: 200, responseText: "{", responseHeaders: "" });
    };
    await expect(new GmTransport(gm).request({ method: "GET", url: "https://www.duolingo.com/test" })).rejects.toThrow(
      "Invalid JSON response from www.duolingo.com"
    );
  });

  it("rejects network errors without leaking authorization values", async () => {
    const gm: GmXmlHttpRequest = (options) => {
      options.onerror(new Error("hidden"));
    };
    const secret = "Bearer test-secret";
    await expect(
      new GmTransport(gm).request({ method: "GET", url: "https://www.duolingo.com/test", headers: { authorization: secret } })
    ).rejects.not.toThrow(secret);
  });

  it("does not persist tokens when creating a demo client", () => {
    const setItem = vi.fn();
    Object.defineProperty(globalThis, "localStorage", {
      value: { setItem },
      configurable: true
    });
    const gm: GmXmlHttpRequest = () => {};
    const client = createDemoClient("header.payload.signature", new GmTransport(gm));
    expect(client).toBeDefined();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("normalizes pasted token values", () => {
    expect(normalizeTokenInput(" Bearer header.payload.signature ")).toBe("header.payload.signature");
    expect(normalizeTokenInput("header%2Epayload%2Esignature")).toBe("header.payload.signature");
  });
});
