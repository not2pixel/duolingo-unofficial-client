import { z } from "zod";
import type { DuolingoLeaderboard, DuolingoLeaderboardEntry } from "../types";

const rankingSchema = z
  .object({
    user_id: z.union([z.string(), z.number()]),
    username: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    score: z.number().optional().default(0),
    rank: z.number().nullable().optional(),
    picture: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional()
  })
  .passthrough();

export const upstreamLeaderboardSchema = z
  .object({
    active: z
      .object({
        cohort: z
          .object({
            rankings: z.array(rankingSchema).optional().default([])
          })
          .passthrough()
          .optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough();

function mapEntry(entry: z.infer<typeof rankingSchema>, index: number): DuolingoLeaderboardEntry {
  return {
    userId: String(entry.user_id),
    username: entry.username ?? null,
    displayName: entry.display_name ?? entry.name ?? null,
    score: entry.score,
    rank: entry.rank ?? index + 1,
    pictureUrl: entry.avatar_url ?? entry.picture ?? null
  };
}

export function mapLeaderboard(input: unknown, currentUserId?: string): DuolingoLeaderboard {
  const parsed = upstreamLeaderboardSchema.parse(input);
  const entries = (parsed.active?.cohort?.rankings ?? []).map(mapEntry);
  return {
    entries,
    currentUser: currentUserId ? entries.find((entry) => entry.userId === currentUserId) ?? null : null
  };
}
