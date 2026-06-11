import { describe, expect, it } from "vitest";
import { isDemoAccessAllowed, timingSafeStringEqual } from "../lib/security.js";

describe("security helpers", () => {
  it("allows access when no demo access key is configured", () => {
    expect(isDemoAccessAllowed(undefined, null)).toBe(true);
  });

  it("requires a matching demo access key when configured", () => {
    expect(isDemoAccessAllowed("secret", null)).toBe(false);
    expect(isDemoAccessAllowed("secret", "wrong")).toBe(false);
    expect(isDemoAccessAllowed("secret", "secret")).toBe(true);
  });

  it("compares strings safely", () => {
    expect(timingSafeStringEqual("a", "a")).toBe(true);
    expect(timingSafeStringEqual("a", "b")).toBe(false);
  });
});
