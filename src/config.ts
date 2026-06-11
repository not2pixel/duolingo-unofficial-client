import { DuolingoConfigurationError } from "./errors";
import type { TokenProvider } from "./auth/types";
import type { DuolingoTransport } from "./transport/transport";

export interface DuolingoBaseUrls {
  web: string;
  goals: string;
  leaderboards: string;
  stories: string;
}

export interface DuolingoClientConfig {
  token?: string;
  tokenProvider?: TokenProvider;
  transport?: DuolingoTransport;
  baseUrls?: Partial<DuolingoBaseUrls>;
}

export const DEFAULT_BASE_URLS: DuolingoBaseUrls = {
  web: "https://www.duolingo.com",
  goals: "https://goals-api.duolingo.com",
  leaderboards: "https://duolingo-leaderboards-prod.duolingo.com",
  stories: "https://stories.duolingo.com"
};

export const ENDPOINTS = {
  users: {
    currentFields: "id,username,fromLanguage,learningLanguage,streak,totalXp,gems,picture,streakData",
    currentCourseFields: "currentCourse{pathSectioned{units{levels{pathLevelMetadata{skillId},pathLevelClientData{skillId}}}}}",
    byId: (id: string, fields: string) => `/2017-06-30/users/${encodeURIComponent(id)}?fields=${encodeURIComponent(fields)}`
  },
  leaderboards: {
    currentWeekly: (id: string) =>
      `/leaderboards/7d9f5dd1-8423-491a-91f2-2532052038ce/users/${encodeURIComponent(id)}?client_unlocked=true`
  },
  goals: {
    schema: (uiLanguage: string) => `/schema?ui_language=${encodeURIComponent(uiLanguage)}`,
    progress: (id: string, timezone: string, uiLanguage: string) =>
      `/users/${encodeURIComponent(id)}/progress?timezone=${encodeURIComponent(timezone)}&ui_language=${encodeURIComponent(uiLanguage)}`
  },
  shop: {
    items: "/2023-05-23/shop-items"
  }
} as const;

export function normalizeBaseUrls(input?: Partial<DuolingoBaseUrls>): DuolingoBaseUrls {
  const urls = { ...DEFAULT_BASE_URLS, ...input };
  for (const [name, value] of Object.entries(urls)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch (error) {
      throw new DuolingoConfigurationError(`Base URL for ${name} is invalid`, { cause: error });
    }
    if (url.protocol !== "https:") {
      throw new DuolingoConfigurationError(`Base URL for ${name} must use https`);
    }
  }
  return urls;
}

export function allowedOrigins(baseUrls: DuolingoBaseUrls): Set<string> {
  return new Set(Object.values(baseUrls).map((value) => new URL(value).origin));
}
