import { z } from "zod";
import type { DuolingoShopItem } from "../types";

const shopItemSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    currencyType: z.string().nullable().optional()
  })
  .passthrough();

export const upstreamShopResponseSchema = z
  .object({
    shopItems: z.array(shopItemSchema).optional().default([])
  })
  .passthrough();

export function mapShopItems(input: unknown): DuolingoShopItem[] {
  const parsed = upstreamShopResponseSchema.parse(input);
  return parsed.shopItems.map((item) => ({
    id: item.id,
    name: item.name ?? null,
    type: item.type ?? null,
    currencyType: item.currencyType ?? null,
    raw: item
  }));
}
