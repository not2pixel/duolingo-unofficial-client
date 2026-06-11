import { describe, expect, it } from "vitest";
import { DuolingoAuthError, DuolingoRateLimitError } from "@duohacker/duolingo";
import { formatProfileText, runCli } from "../index";
import type { DuolingoUser } from "@duohacker/duolingo";

const user: DuolingoUser = {
  id: "123",
  username: "example",
  displayName: "Example",
  pictureUrl: null,
  streak: 120,
  totalXp: 25000,
  gems: 1500,
  fromLanguage: "en",
  learningLanguage: "es"
};

describe("Node CLI demo", () => {
  it("fails clearly when DUOLINGO_TOKEN is missing", async () => {
    const stderr: string[] = [];
    const code = await runCli({ env: {}, stderr: (text) => stderr.push(text), stdout: () => undefined });
    expect(code).toBe(1);
    expect(stderr.join("\n")).toContain("Missing DUOLINGO_TOKEN");
  });

  it("formats text output", async () => {
    const stdout: string[] = [];
    const code = await runCli({
      env: { DUOLINGO_TOKEN: "secret-token" },
      stdout: (text) => stdout.push(text),
      clientFactory: () => ({ users: { getCurrent: async () => user } })
    });
    expect(code).toBe(0);
    expect(stdout.join("\n")).toContain("Connected successfully");
    expect(stdout.join("\n")).toContain("Username: example");
    expect(stdout.join("\n")).not.toContain("secret-token");
  });

  it("formats JSON output as JSON only", async () => {
    const stdout: string[] = [];
    const code = await runCli({
      argv: ["--json"],
      env: { DUOLINGO_TOKEN: "secret-token" },
      stdout: (text) => stdout.push(text),
      stderr: () => undefined,
      clientFactory: () => ({ users: { getCurrent: async () => user } })
    });
    expect(code).toBe(0);
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ username: "example", displayName: "Example" });
    expect(stdout.join("\n")).not.toContain("secret-token");
  });

  it("returns a non-zero exit code on failure", async () => {
    const stderr: string[] = [];
    const code = await runCli({
      env: { DUOLINGO_TOKEN: "secret-token" },
      stderr: (text) => stderr.push(text),
      clientFactory: () => ({ users: { getCurrent: async () => { throw new DuolingoAuthError("secret-token"); } } })
    });
    expect(code).toBe(1);
    expect(stderr.join("\n")).toContain("Authentication failed");
    expect(stderr.join("\n")).not.toContain("secret-token");
  });

  it("redacts token values in rate-limit errors", async () => {
    const stdout: string[] = [];
    const code = await runCli({
      argv: ["--json"],
      env: { DUOLINGO_TOKEN: "secret-token" },
      stdout: (text) => stdout.push(text),
      clientFactory: () => ({ users: { getCurrent: async () => { throw new DuolingoRateLimitError("secret-token"); } } })
    });
    expect(code).toBe(1);
    expect(stdout.join("\n")).toContain("rate-limited");
    expect(stdout.join("\n")).not.toContain("secret-token");
  });

  it("handles nullable values", () => {
    expect(formatProfileText({ ...user, displayName: null, gems: null })).toContain("Gems: Not available");
  });
});
