import { z } from "zod";
import type { DuolingoCourse, DuolingoUser } from "../types";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const upstreamUserSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    username: z.string().optional().default(""),
    name: nullableString,
    displayName: nullableString,
    picture: nullableString,
    pictureUrl: nullableString,
    fromLanguage: nullableString,
    learningLanguage: nullableString,
    totalXp: nullableNumber,
    gems: nullableNumber,
    streak: nullableNumber
  })
  .passthrough();

const levelSchema = z
  .object({
    pathLevelMetadata: z.object({ skillId: z.string().optional() }).passthrough().optional(),
    pathLevelClientData: z.object({ skillId: z.string().optional() }).passthrough().optional()
  })
  .passthrough();

const currentCourseSchema = z
  .object({
    pathSectioned: z
      .array(
        z
          .object({
            units: z.array(z.object({ levels: z.array(levelSchema).optional() }).passthrough()).optional()
          })
          .passthrough()
      )
      .optional()
  })
  .passthrough();

export const upstreamCourseResponseSchema = z
  .object({
    currentCourse: currentCourseSchema.nullable().optional()
  })
  .passthrough();

export function mapUser(input: unknown): DuolingoUser {
  const parsed = upstreamUserSchema.parse(input);
  return {
    id: String(parsed.id),
    username: parsed.username,
    displayName: parsed.displayName ?? parsed.name ?? null,
    pictureUrl: parsed.pictureUrl ?? parsed.picture ?? null,
    fromLanguage: parsed.fromLanguage ?? null,
    learningLanguage: parsed.learningLanguage ?? null,
    totalXp: parsed.totalXp ?? null,
    gems: parsed.gems ?? null,
    streak: parsed.streak ?? null
  };
}

export function mapCourse(input: unknown): DuolingoCourse {
  const parsed = upstreamCourseResponseSchema.parse(input);
  let firstSkillId: string | null = null;
  const sections = parsed.currentCourse?.pathSectioned ?? [];
  for (const section of sections) {
    for (const unit of section.units ?? []) {
      for (const level of unit.levels ?? []) {
        firstSkillId = level.pathLevelMetadata?.skillId ?? level.pathLevelClientData?.skillId ?? null;
        if (firstSkillId) return { firstSkillId, raw: parsed.currentCourse ?? null };
      }
    }
  }
  return { firstSkillId, raw: parsed.currentCourse ?? null };
}
