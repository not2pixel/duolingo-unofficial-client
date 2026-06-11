import { describe, expect, it, vi } from "vitest";
import {
  DuolingoAuthError,
  DuolingoClient,
  DuolingoConfigurationError,
  DuolingoHttpError,
  DuolingoParseError,
  DuolingoRateLimitError,
  FetchTransport,
  decodeJwt,
  redactHeaders,
  type DuolingoTransport,
  type TransportRequest,
  type TransportResponse
} from "../src";

interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  data: unknown;
}

class MockTransport implements DuolingoTransport {
  readonly requests: TransportRequest[] = [];
  readonly #responses: MockResponse[];

  constructor(...responses: MockResponse[]) {
    this.#responses = responses;
  }

  async request<T>(request: TransportRequest): Promise<TransportResponse<T>> {
    this.requests.push(request);
    if (request.signal?.aborted) {
      throw new Error("aborted");
    }
    const response = this.#responses.shift() ?? { status: 200, data: {} };
    return {
      status: response.status,
      headers: response.headers ?? {},
      data: response.data as T
    };
  }
}

function token(payload: Record<string, unknown> = { sub: "123456" }): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf8")
      .toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("auth", () => {
  it("decodes JWT Base64URL payloads without verification", () => {
    const decoded = decodeJwt(token({ sub: "abc-123", iss: "duolingo" }));
    expect(decoded.sub).toBe("abc-123");
    expect(decoded.iss).toBe("duolingo");
  });

  it("throws for missing tokens", async () => {
    const client = new DuolingoClient({ transport: new MockTransport() });
    await expect(client.users.getCurrent()).rejects.toBeInstanceOf(DuolingoAuthError);
  });

  it("generates authorization headers", async () => {
    const transport = new MockTransport({
      status: 200,
      data: { id: 123456, username: "learner" }
    });
    const client = new DuolingoClient({ token: token(), transport });
    await client.users.getCurrent();
    expect(transport.requests[0]?.headers?.authorization).toBe(`Bearer ${token()}`);
  });

  it("redacts authorization headers", () => {
    expect(redactHeaders({ authorization: "Bearer secret", accept: "application/json" })).toEqual({
      authorization: "[REDACTED]",
      accept: "application/json"
    });
  });
});

describe("response mapping", () => {
  it("maps users with optional and missing profile fields", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({
        status: 200,
        data: {
          id: 123456,
          username: "learner",
          picture: "https://example.invalid/avatar.png",
          totalXp: 9001
        }
      })
    });

    await expect(client.users.getCurrent()).resolves.toEqual({
      id: "123456",
      username: "learner",
      displayName: null,
      pictureUrl: "https://example.invalid/avatar.png",
      fromLanguage: null,
      learningLanguage: null,
      totalXp: 9001,
      gems: null,
      streak: null
    });
  });

  it("maps leaderboard standings", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({
        status: 200,
        data: {
          active: {
            cohort: {
              rankings: [
                { user_id: "999", username: "top", score: 100 },
                { user_id: "123456", username: "me", score: 50 }
              ]
            }
          }
        }
      })
    });

    const leaderboard = await client.leaderboards.getCurrent();
    expect(leaderboard.entries).toHaveLength(2);
    expect(leaderboard.currentUser?.rank).toBe(2);
  });

  it("parses goals schema", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({
        status: 200,
        data: {
          goals: [{ goalId: "2026_06_monthly", badgeId: "badge", category: "MONTHLY", metric: "XP", threshold: 100, title: { uiString: "Monthly XP" } }],
          badges: [{ badgeId: "badge" }]
        }
      })
    });

    await expect(client.goals.getSchema()).resolves.toMatchObject({
      goals: [{ goalId: "2026_06_monthly", title: "Monthly XP", threshold: 100 }]
    });
  });

  it("parses goals progress", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({
        status: 200,
        data: {
          goals: { progress: { daily_xp: { progress: 20 }, lessons: 3 } },
          badges: { earned: ["daily_badge"] }
        }
      })
    });

    await expect(client.goals.getProgress({ timezone: "UTC" })).resolves.toEqual({
      progress: { daily_xp: 20, lessons: 3 },
      earnedBadges: ["daily_badge"]
    });
  });

  it("parses shop catalog items", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({
        status: 200,
        data: {
          shopItems: [{ id: "streak_freeze", name: "Streak Freeze", type: "powerup", currencyType: "XGM" }]
        }
      })
    });

    await expect(client.shop.listItems()).resolves.toMatchObject([
      { id: "streak_freeze", name: "Streak Freeze", type: "powerup", currencyType: "XGM" }
    ]);
  });

  it("returns current course data with first skill id", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({
        status: 200,
        data: {
          currentCourse: {
            pathSectioned: [{ units: [{ levels: [{ pathLevelMetadata: { skillId: "skill-a" } }] }] }]
          }
        }
      })
    });

    await expect(client.courses.getCurrent()).resolves.toMatchObject({ firstSkillId: "skill-a" });
  });
});

describe("errors and safety", () => {
  it("handles 401 responses", async () => {
    const client = new DuolingoClient({ token: token(), transport: new MockTransport({ status: 401, data: { error: "no" } }) });
    await expect(client.users.getCurrent()).rejects.toBeInstanceOf(DuolingoAuthError);
  });

  it("handles 429 responses", async () => {
    const client = new DuolingoClient({
      token: token(),
      transport: new MockTransport({ status: 429, headers: { "retry-after": "30" }, data: { error: "rate" } })
    });
    await expect(client.users.getCurrent()).rejects.toBeInstanceOf(DuolingoRateLimitError);
  });

  it("handles 500 responses", async () => {
    const client = new DuolingoClient({ token: token(), transport: new MockTransport({ status: 500, data: { error: "server" } }) });
    await expect(client.users.getCurrent()).rejects.toBeInstanceOf(DuolingoHttpError);
  });

  it("throws parse errors for invalid JSON in FetchTransport", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response("{", { status: 200, headers: { "content-type": "application/json" } }));
    const transport = new FetchTransport();
    await expect(transport.request({ method: "GET", url: "https://www.duolingo.com/test" })).rejects.toBeInstanceOf(DuolingoParseError);
    globalThis.fetch = originalFetch;
  });

  it("throws parse errors for invalid response schema", async () => {
    const client = new DuolingoClient({ token: token(), transport: new MockTransport({ status: 200, data: { username: "missing id" } }) });
    await expect(client.users.getCurrent()).rejects.toBeInstanceOf(DuolingoParseError);
  });

  it("passes request cancellation signals to the transport", async () => {
    const controller = new AbortController();
    controller.abort();
    const client = new DuolingoClient({ token: token(), transport: new MockTransport({ status: 200, data: {} }) });
    await expect(client.request({ method: "GET", path: "/test", signal: controller.signal })).rejects.toThrow("aborted");
  });

  it("rejects credentials sent to a non-allowlisted host", async () => {
    const client = new DuolingoClient({ token: token(), transport: new MockTransport() });
    await expect(client.request({ method: "GET", path: "https://example.com/users/me" })).rejects.toBeInstanceOf(DuolingoConfigurationError);
  });
});
