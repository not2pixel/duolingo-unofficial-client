import { ENDPOINTS } from "../config";
import type { DuolingoClient } from "../client";
import { mapCourse } from "../schemas/user";
import type { DuolingoCourse } from "../types";

export class CoursesModule {
  constructor(private readonly client: DuolingoClient) {}

  /**
   * Gets current-course path data requested by the reference userscript.
   *
   * The upstream shape is unstable, so the raw course is returned with only the
   * first discovered skill id normalized.
   */
  async getCurrent(): Promise<DuolingoCourse> {
    const id = await this.client.requireCurrentUserId();
    const path = ENDPOINTS.users.byId(id, ENDPOINTS.users.currentCourseFields);
    const data = await this.client.request<unknown>({ method: "GET", path });
    return this.client.parseSchema(mapCourse, data, path);
  }
}
