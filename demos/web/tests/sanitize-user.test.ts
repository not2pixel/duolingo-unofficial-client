import { describe, expect, it } from "vitest";
import { safeHttpsUrl, sanitizeUser } from "../lib/sanitize-user.js";
import type { DuolingoUser } from "@duohacker/duolingo";

describe("sanitizeUser", () => {
  it("keeps only display-safe fields", () => {
    const user: DuolingoUser = {
      id: "secret-id",
      username: "example",
      displayName: "Example",
      pictureUrl: "https://avatar.example/image.png",
      streak: 1,
      totalXp: 2,
      gems: 3,
      fromLanguage: "en",
      learningLanguage: "es"
    };
    expect(sanitizeUser(user)).toEqual({
      username: "example",
      displayName: "Example",
      pictureUrl: "https://avatar.example/image.png",
      streak: 1,
      totalXp: 2,
      gems: 3,
      fromLanguage: "en",
      learningLanguage: "es"
    });
  });

  it("handles nullable values", () => {
    const user: DuolingoUser = {
      id: "123",
      username: "example",
      displayName: null,
      pictureUrl: null,
      streak: null,
      totalXp: null,
      gems: null,
      fromLanguage: null,
      learningLanguage: null
    };
    expect(sanitizeUser(user).displayName).toBeNull();
    expect(sanitizeUser(user).pictureUrl).toBeNull();
  });

  it("rejects unsafe avatar URLs", () => {
    expect(safeHttpsUrl("http://avatar.example/image.png")).toBeNull();
    expect(safeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpsUrl("https://avatar.example/image.png")).toBe("https://avatar.example/image.png");
  });
});
