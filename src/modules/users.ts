import { ENDPOINTS } from "../config";
import type { DuolingoClient } from "../client";
import { mapUser } from "../schemas/user";
import type { DuolingoUser } from "../types";

export class UsersModule {
  constructor(private readonly client: DuolingoClient) {}

  /** Gets the authenticated user's public profile summary. */
  async getCurrent(): Promise<DuolingoUser> {
    const id = await this.client.requireCurrentUserId();
    return this.getById(id);
  }

  /** Gets a user profile by id using fields found in the reference userscript. */
  async getById(id: string): Promise<DuolingoUser> {
    const path = ENDPOINTS.users.byId(id, ENDPOINTS.users.currentFields);
    const data = await this.client.request<unknown>({ method: "GET", path });
    return this.client.parseSchema(mapUser, data, path);
  }
}
