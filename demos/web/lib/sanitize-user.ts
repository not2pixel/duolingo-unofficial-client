import type { DuolingoUser } from "@duohacker/duolingo";

export interface PublicDemoUser {
  username: string;
  displayName: string | null;
  pictureUrl: string | null;
  streak: number | null;
  totalXp: number | null;
  gems: number | null;
  fromLanguage: string | null;
  learningLanguage: string | null;
}

export function safeHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function sanitizeUser(user: DuolingoUser): PublicDemoUser {
  return {
    username: user.username,
    displayName: user.displayName,
    pictureUrl: safeHttpsUrl(user.pictureUrl),
    streak: user.streak,
    totalXp: user.totalXp,
    gems: user.gems,
    fromLanguage: user.fromLanguage,
    learningLanguage: user.learningLanguage
  };
}
