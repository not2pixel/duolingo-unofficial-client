import { ENDPOINTS } from "../config";
import type { DuolingoClient } from "../client";
import { mapShopItems } from "../schemas/shop";
import type { DuolingoShopItem } from "../types";

export class ShopModule {
  constructor(private readonly client: DuolingoClient) {}

  /** Lists shop catalog items. No purchase or claim methods are exposed. */
  async listItems(): Promise<DuolingoShopItem[]> {
    const path = ENDPOINTS.shop.items;
    const data = await this.client.request<unknown>({ method: "GET", path });
    return this.client.parseSchema(mapShopItems, data, path);
  }
}
