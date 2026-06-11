import { z } from "zod";
import type { DuolingoGoalProgress, DuolingoGoalSchema } from "../types";

const titleSchema = z.object({ uiString: z.string().optional() }).passthrough();

const goalSchema = z
  .object({
    goalId: z.string(),
    badgeId: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    metric: z.string().nullable().optional(),
    threshold: z.number().nullable().optional(),
    title: titleSchema.nullable().optional()
  })
  .passthrough();

export const upstreamGoalSchemaResponse = z
  .object({
    goals: z.array(goalSchema).optional().default([]),
    badges: z.array(z.unknown()).optional().default([])
  })
  .passthrough();

const progressValueSchema = z.union([z.number(), z.object({ progress: z.number().optional() }).passthrough()]);

export const upstreamGoalProgressResponse = z
  .object({
    goals: z
      .object({
        progress: z.record(progressValueSchema).optional().default({})
      })
      .passthrough()
      .optional(),
    badges: z
      .object({
        earned: z.array(z.string()).optional().default([])
      })
      .passthrough()
      .optional()
  })
  .passthrough();

export function mapGoalSchema(input: unknown): DuolingoGoalSchema {
  const parsed = upstreamGoalSchemaResponse.parse(input);
  return {
    goals: parsed.goals.map((goal) => ({
      goalId: goal.goalId,
      badgeId: goal.badgeId ?? null,
      category: goal.category ?? null,
      metric: goal.metric ?? null,
      threshold: goal.threshold ?? null,
      title: goal.title?.uiString ?? null
    })),
    badges: parsed.badges
  };
}

export function mapGoalProgress(input: unknown): DuolingoGoalProgress {
  const parsed = upstreamGoalProgressResponse.parse(input);
  const progress: Record<string, number> = {};
  for (const [goalId, value] of Object.entries(parsed.goals?.progress ?? {})) {
    progress[goalId] = typeof value === "number" ? value : value.progress ?? 0;
  }
  return {
    progress,
    earnedBadges: parsed.badges?.earned ?? []
  };
}
