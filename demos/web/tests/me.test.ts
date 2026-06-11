import { describe, expect, it } from "vitest";
import {
  DuolingoAuthError,
  DuolingoHttpError,
  DuolingoParseError,
  DuolingoRateLimitError,
  type DuolingoUser
} from "@duohacker/duolingo";
import { handleMeRequest } from "../api/me.js";

const user: DuolingoUser = {
  id: "123",
  username: "example",
  displayName: "Example",
  pictureUrl: "https://avatar.example/image.png",
  streak: 120,
  totalXp: 25000,
  gems: 1500,
  fromLanguage: "en",
  learningLanguage: "es"
};

function clientFactory(result: DuolingoUser | Error) {
  return () => ({
    users: {
      getCurrent: async () => {
        if (result instanceof Error) throw result;
        return result;
      }
    }
  });
}

describe("/api/me", () => {
  it("rejects unsupported methods", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me", { method: "POST" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
  });

  it("rejects missing server configuration", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me"), { config: {} });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "SERVER_CONFIGURATION_MISSING" } });
  });

  it("rejects missing and invalid demo access keys", async () => {
    const missing = await handleMeRequest(new Request("https://demo.test/api/me"), {
      config: { duolingoToken: "server-token", demoAccessKey: "demo-key" },
      clientFactory: clientFactory(user)
    });
    expect(missing.status).toBe(401);

    const invalid = await handleMeRequest(new Request("https://demo.test/api/me", { headers: { "X-Demo-Access-Key": "bad" } }), {
      config: { duolingoToken: "server-token", demoAccessKey: "demo-key" },
      clientFactory: clientFactory(user)
    });
    expect(invalid.status).toBe(401);
  });

  it("returns sanitized profile data with a valid demo access key", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me", { headers: { "X-Demo-Access-Key": "demo-key" } }), {
      config: { duolingoToken: "server-token", demoAccessKey: "demo-key" },
      clientFactory: clientFactory(user)
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({
      username: "example",
      displayName: "Example",
      pictureUrl: "https://avatar.example/image.png",
      streak: 120,
      totalXp: 25000,
      gems: 1500,
      fromLanguage: "en",
      learningLanguage: "es"
    });
    expect(JSON.stringify(body)).not.toContain("server-token");
    expect([...response.headers.entries()].join("\n")).not.toContain("server-token");
  });

  it("maps nullable profile values", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me"), {
      config: { duolingoToken: "server-token" },
      clientFactory: clientFactory({ ...user, displayName: null, pictureUrl: "http://avatar.example/image.png", gems: null })
    });
    const body = await response.json();
    expect(body.displayName).toBeNull();
    expect(body.pictureUrl).toBeNull();
    expect(body.gems).toBeNull();
  });

  it("maps rate limits", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me"), {
      config: { duolingoToken: "server-token" },
      clientFactory: clientFactory(new DuolingoRateLimitError("secret token"))
    });
    expect(response.status).toBe(429);
    expect(JSON.stringify(await response.json())).not.toContain("secret token");
  });

  it("maps authentication errors", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me"), {
      config: { duolingoToken: "server-token" },
      clientFactory: clientFactory(new DuolingoAuthError("secret token"))
    });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "AUTHENTICATION_FAILED" } });
  });

  it("maps upstream server errors", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me"), {
      config: { duolingoToken: "server-token" },
      clientFactory: clientFactory(new DuolingoHttpError("server", { status: 500 }))
    });
    expect(response.status).toBe(503);
  });

  it("maps invalid upstream response errors", async () => {
    const response = await handleMeRequest(new Request("https://demo.test/api/me"), {
      config: { duolingoToken: "server-token" },
      clientFactory: clientFactory(new DuolingoParseError("bad body"))
    });
    expect(response.status).toBe(502);
  });
});
