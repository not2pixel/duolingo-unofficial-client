import {
  DuolingoClient,
  DuolingoAuthError,
  DuolingoHttpError,
  DuolingoRateLimitError,
  getTokenInformation,
  type DuolingoBaseUrls,
  type DuolingoTransport,
  type DuolingoUser
} from "@duohacker/duolingo";
import { GmTransport, type GmXmlHttpRequest } from "./gm-transport";

interface UserscriptGlobals {
  GM_xmlhttpRequest?: GmXmlHttpRequest;
  GM_addStyle?: (css: string) => void;
  GM?: {
    xmlHttpRequest?: GmXmlHttpRequest;
    addStyle?: (css: string) => void;
  };
}

interface DemoState {
  token: string | null;
  client: DuolingoClient | null;
  user: DuolingoUser | null;
  status: "disconnected" | "loading" | "connected" | "error";
  error: string | null;
}

const state: DemoState = {
  token: null,
  client: null,
  user: null,
  status: "disconnected",
  error: null
};

export function createDemoClient(token: string, transport?: DuolingoTransport): DuolingoClient {
  const options: {
    token: string;
    transport: DuolingoTransport;
    baseUrls?: Partial<DuolingoBaseUrls>;
  } = {
    token: normalizeTokenInput(token),
    transport: transport ?? new GmTransport(resolveGmXmlHttpRequest())
  };
  const baseUrls = baseUrlsForCurrentPage();
  if (baseUrls) options.baseUrls = baseUrls;
  return new DuolingoClient(options);
}

export function formatUserValue(value: string | number | null): string {
  return value === null || value === "" ? "Not available" : String(value);
}

export function normalizeTokenInput(input: string): string {
  let token = input.trim();
  const cookieMatch = token.match(/(?:^|;\s*)jwt_token=([^;]+)/i) ?? token.match(/^jwt_token=([^;]+)$/i);
  if (cookieMatch?.[1]) token = cookieMatch[1].trim();
  if (token.toLowerCase().startsWith("bearer ")) token = token.slice(7).trim();
  try {
    const decoded = decodeURIComponent(token);
    if (decoded.includes(".")) token = decoded;
  } catch {
    // Keep the original token if it is not URL encoded.
  }
  return token;
}

export function getJwtFromCurrentPageCookie(cookie = typeof document === "undefined" ? "" : document.cookie): string | null {
  const match = cookie.match(/(?:^|;\s*)jwt_token=([^;]+)/i);
  return match?.[1] ? normalizeTokenInput(match[1]) : null;
}

export function isLikelyJwt(token: string): boolean {
  if (token.split(".").length !== 3) return false;
  try {
    getTokenInformation(token);
    return true;
  } catch {
    return false;
  }
}

function resolveGmXmlHttpRequest(): GmXmlHttpRequest {
  const globals = globalThis as typeof globalThis & UserscriptGlobals;
  const request = globals.GM_xmlhttpRequest ?? globals.GM?.xmlHttpRequest;
  if (!request) {
    throw new Error("GM_xmlhttpRequest is unavailable. Check the userscript manager grants.");
  }
  return request;
}

function addStyle(css: string): void {
  const globals = globalThis as typeof globalThis & UserscriptGlobals;
  const gmAddStyle = globals.GM_addStyle ?? globals.GM?.addStyle;
  if (gmAddStyle) {
    gmAddStyle(css);
    return;
  }
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
}

function baseUrlsForCurrentPage(): Partial<DuolingoBaseUrls> | null {
  if (typeof location === "undefined") return null;
  if (location.hostname.endsWith("duolingo.cn")) {
    return { web: "https://www.duolingo.cn" };
  }
  return null;
}

function formatError(error: unknown): string {
  if (error instanceof DuolingoAuthError) {
    if (error.status === 401 || error.status === 403) {
      return "Duolingo rejected this token. Use Page Login or paste a fresh jwt_token from the same account.";
    }
    return "Invalid JWT. Paste the jwt_token value, a jwt_token=... cookie, or a Bearer token.";
  }
  if (error instanceof DuolingoRateLimitError) return "Duolingo rate-limited the request. Please wait and try again.";
  if (error instanceof DuolingoHttpError) return "Duolingo returned an upstream error. Please try again later.";
  if (error instanceof Error) return error.message;
  return "Unable to load the profile.";
}

function avatarUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function row(label: string, value: string | number | null): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "duc-row";
  const name = document.createElement("span");
  name.textContent = label;
  const output = document.createElement("strong");
  output.textContent = formatUserValue(value);
  item.append(name, output);
  return item;
}

function render(root: HTMLElement): void {
  root.textContent = "";

  const title = document.createElement("div");
  title.className = "duc-title";
  title.textContent = "Duolingo Client Demo";

  const status = document.createElement("div");
  status.className = `duc-status duc-${state.status}`;
  status.setAttribute("aria-live", "polite");
  status.textContent =
    state.status === "connected"
      ? "Connected"
      : state.status === "loading"
        ? "Loading profile..."
        : state.status === "error"
          ? state.error ?? "Error"
          : "Disconnected";

  const actions = document.createElement("div");
  actions.className = "duc-actions";

  const connect = document.createElement("button");
  connect.type = "button";
  connect.textContent = state.client ? "Refresh" : "Connect";
  connect.disabled = state.status === "loading";
  connect.addEventListener("click", () => {
    if (state.client) void loadProfile(root);
    else void connectClient(root);
  });

  const usePageLogin = document.createElement("button");
  usePageLogin.type = "button";
  usePageLogin.textContent = "Use Page Login";
  usePageLogin.disabled = state.status === "loading";
  usePageLogin.title = "Read jwt_token from this Duolingo page cookie and keep it in memory only.";
  usePageLogin.addEventListener("click", () => {
    void connectFromPageCookie(root);
  });

  const disconnect = document.createElement("button");
  disconnect.type = "button";
  disconnect.textContent = "Disconnect";
  disconnect.disabled = !state.client || state.status === "loading";
  disconnect.addEventListener("click", () => {
    state.token = null;
    state.client = null;
    state.user = null;
    state.error = null;
    state.status = "disconnected";
    render(root);
  });

  actions.append(connect, usePageLogin, disconnect);
  root.append(title, status, actions);

  if (state.user) {
    const card = document.createElement("div");
    card.className = "duc-card";
    const pic = avatarUrl(state.user.pictureUrl);
    if (pic) {
      const img = document.createElement("img");
      img.src = pic;
      img.alt = `${state.user.username || "Duolingo user"} avatar`;
      img.className = "duc-avatar";
      card.append(img);
    }
    card.append(
      row("Username", state.user.username),
      row("Display name", state.user.displayName),
      row("Streak", state.user.streak === null ? null : `${state.user.streak} days`),
      row("Total XP", state.user.totalXp),
      row("Gems", state.user.gems),
      row("From language", state.user.fromLanguage),
      row("Learning language", state.user.learningLanguage)
    );
    root.append(card);
  }
}

async function connectClient(root: HTMLElement): Promise<void> {
  const token = window.prompt("Paste a Duolingo JWT, jwt_token=... cookie, or Bearer token for this session only");
  if (!token) return;
  await connectWithToken(root, normalizeTokenInput(token));
}

async function connectFromPageCookie(root: HTMLElement): Promise<void> {
  const token = getJwtFromCurrentPageCookie();
  if (!token) {
    state.status = "error";
    state.error = "No jwt_token cookie is visible on this page. Log in to Duolingo, then retry or paste the token manually.";
    render(root);
    return;
  }
  await connectWithToken(root, token);
}

async function connectWithToken(root: HTMLElement, token: string): Promise<void> {
  const normalized = normalizeTokenInput(token);
  if (!isLikelyJwt(normalized)) {
    state.status = "error";
    state.error = "That does not look like a valid JWT. Paste the jwt_token value, jwt_token=... cookie, or a Bearer token.";
    render(root);
    return;
  }
  try {
    state.token = normalized;
    state.client = createDemoClient(normalized);
    await loadProfile(root);
  } catch (error) {
    state.token = null;
    state.client = null;
    state.status = "error";
    state.error = formatError(error);
    render(root);
  }
}

async function loadProfile(root: HTMLElement): Promise<void> {
  if (!state.client) return;
  state.status = "loading";
  state.error = null;
  render(root);
  try {
    state.user = await state.client.users.getCurrent();
    state.status = "connected";
  } catch (error) {
    state.user = null;
    state.status = "error";
    state.error = formatError(error);
  }
  render(root);
}

function mount(): void {
  const existing = document.getElementById("duc-demo-panel");
  if (existing) existing.remove();

  addStyle(`
    #duc-demo-panel {
      position: fixed;
      z-index: 2147483647;
      right: 16px;
      bottom: 16px;
      width: min(320px, calc(100vw - 32px));
      padding: 14px;
      border: 1px solid rgba(0,0,0,.14);
      border-radius: 8px;
      background: #fff;
      color: #202124;
      box-shadow: 0 14px 40px rgba(0,0,0,.18);
      font: 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #duc-demo-panel button {
      border: 1px solid #1c7ed6;
      border-radius: 6px;
      background: #1c7ed6;
      color: #fff;
      cursor: pointer;
      font: inherit;
      padding: 7px 10px;
    }
    #duc-demo-panel button:disabled { opacity: .55; cursor: not-allowed; }
    #duc-demo-panel button:focus-visible { outline: 3px solid #91caff; outline-offset: 2px; }
    #duc-demo-panel .duc-title { font-weight: 700; margin-bottom: 8px; }
    #duc-demo-panel .duc-status { margin-bottom: 10px; }
    #duc-demo-panel .duc-error { color: #b42318; }
    #duc-demo-panel .duc-connected { color: #087f5b; }
    #duc-demo-panel .duc-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    #duc-demo-panel .duc-card { display: grid; gap: 7px; }
    #duc-demo-panel .duc-avatar { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; }
    #duc-demo-panel .duc-row { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid #edf2f7; padding-top: 6px; }
    #duc-demo-panel .duc-row span { color: #5f6368; }
    #duc-demo-panel .duc-row strong { text-align: right; font-weight: 650; overflow-wrap: anywhere; }
  `);

  const root = document.createElement("section");
  root.id = "duc-demo-panel";
  root.setAttribute("aria-label", "Duolingo unofficial client demo");
  document.body.append(root);
  render(root);
}

function mountWhenReady(): void {
  if (document.body) {
    mount();
    return;
  }
  document.addEventListener("DOMContentLoaded", mount, { once: true });
}

if (typeof document !== "undefined") {
  mountWhenReady();
}
