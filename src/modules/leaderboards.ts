import { ENDPOINTS } from "../config";
import type { DuolingoClient } from "../client";
import { mapLeaderboard } from "../schemas/leaderboard";
import type { DuolingoLeaderboard } from "../types";

export class LeaderboardsModule {
  constructor(private readonly client: DuolingoClient) {}

  /** Gets current weekly leaderboard standings for the authenticated user. */
  async getCurrent(): Promise<DuolingoLeaderboard> {
    const id = await this.client.requireCurrentUserId();
    const path = ENDPOINTS.leaderboards.currentWeekly(id);
    const data = await this.client.request<unknown>({ method: "GET", path, baseUrl: "leaderboards" });
    return this.client.parseSchema((input) => mapLeaderboard(input, id), data, path);
  }
}
