import { ENDPOINTS } from "../config";
import type { DuolingoClient } from "../client";
import { mapGoalProgress, mapGoalSchema } from "../schemas/goals";
import type { DuolingoGoalProgress, DuolingoGoalSchema } from "../types";
import { buildGoalHeaders } from "../utils/headers";

export interface GoalRequestOptions {
  uiLanguage?: string;
}

export interface GoalProgressRequestOptions extends GoalRequestOptions {
  timezone?: string;
}

export class GoalsModule {
  constructor(private readonly client: DuolingoClient) {}

  /** Reads the goal schema. This internal endpoint is unstable. */
  async getSchema(options: GoalRequestOptions = {}): Promise<DuolingoGoalSchema> {
    const path = ENDPOINTS.goals.schema(options.uiLanguage ?? "en");
    const token = await this.client.authTokenForInternalUse();
    const data = await this.client.request<unknown>({
      method: "GET",
      path,
      baseUrl: "goals",
      headers: buildGoalHeaders(token),
      authenticated: false
    });
    return this.client.parseSchema(mapGoalSchema, data, path);
  }

  /** Reads goal progress for the authenticated user. This internal endpoint is unstable. */
  async getProgress(options: GoalProgressRequestOptions = {}): Promise<DuolingoGoalProgress> {
    const id = await this.client.requireCurrentUserId();
    const timezone = options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const path = ENDPOINTS.goals.progress(id, timezone, options.uiLanguage ?? "en");
    const token = await this.client.authTokenForInternalUse();
    const data = await this.client.request<unknown>({
      method: "GET",
      path,
      baseUrl: "goals",
      headers: buildGoalHeaders(token),
      authenticated: false
    });
    return this.client.parseSchema(mapGoalProgress, data, path);
  }
}
