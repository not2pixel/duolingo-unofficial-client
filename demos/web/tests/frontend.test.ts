import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";

function loadDom() {
  const root = join(import.meta.dirname, "..", "public");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const script = readFileSync(join(root, "app.js"), "utf8");
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://demo.test" });
  dom.window.eval(script);
  return dom;
}

describe("frontend", () => {
  it("validates avatar URLs", () => {
    const dom = loadDom();
    expect(dom.window.DuolingoDemo.isSafeAvatarUrl("https://avatar.example/a.png")).toBe(true);
    expect(dom.window.DuolingoDemo.isSafeAvatarUrl("http://avatar.example/a.png")).toBe(false);
  });

  it("renders profile values without innerHTML", () => {
    const dom = loadDom();
    dom.window.DuolingoDemo.renderProfile({
      username: "example",
      displayName: null,
      pictureUrl: "javascript:alert(1)",
      streak: 1,
      totalXp: 2,
      gems: 3,
      fromLanguage: "en",
      learningLanguage: "es"
    });
    expect(dom.window.document.getElementById("username")?.textContent).toBe("example");
    expect(dom.window.document.getElementById("displayName")?.textContent).toBe("Not available");
    expect(dom.window.document.getElementById("avatar")?.classList.contains("hidden")).toBe(true);
  });

  it("renders API errors", async () => {
    const dom = loadDom();
    dom.window.fetch = async () =>
      new Response(JSON.stringify({ ok: false, error: { message: "The demo access key is missing or invalid." } }), { status: 401 });
    await dom.window.DuolingoDemo.loadProfile();
    expect(dom.window.document.getElementById("status")?.textContent).toContain("demo access key");
  });
});
