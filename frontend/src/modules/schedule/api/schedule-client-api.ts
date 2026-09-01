import { ApiClientError } from "@/lib/api/api-client-error";
import { browserRequest } from "@/lib/api/browser-request";

import {
  optionListSchema,
  scheduleTemplateListSchema,
  scheduleTemplateSchema,
} from "../schemas/schedule-response-schema";
import type { Option, ScheduleTemplate } from "../types/schedule";

/** Every schedule call goes through this same-origin, allowlisted forwarder. */
const BASE = "/api/schedule";

/**
 * The room and teacher pickers read option endpoints that Academic and Identity
 * own, so they go through the academic gate rather than the schedule one. Calling
 * them from here keeps this module free of any import into `modules/academic`.
 */
const ACADEMIC_BASE = "/api/academic";

/** Query parameters an option picker sends upstream. */
type ListParams = Record<string, string | number | boolean | undefined>;

/**
 * Validates a payload before it reaches a screen, so a malformed upstream
 * response becomes a service failure rather than rows that render as blanks.
 */
function parseOne<T>(
  value: unknown,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
): T {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw ApiClientError.upstreamFailure();
  }

  return parsed.data as T;
}

/**
 * Fetches every fixed schedule of one class, closed ones included.
 *
 * The endpoint answers with a `data` envelope and no `meta`, so this reads the
 * plain unwrapped payload instead of the paginated helper.
 */
export async function fetchScheduleTemplates(classId: number): Promise<ScheduleTemplate[]> {
  return parseOne<ScheduleTemplate[]>(
    await browserRequest<unknown>(`${BASE}/classes/${classId}/schedule-templates`),
    scheduleTemplateListSchema,
  );
}

/** Opens a weekly slot for a class. */
export async function createScheduleTemplate(
  classId: number,
  body: unknown,
): Promise<ScheduleTemplate> {
  return parseOne<ScheduleTemplate>(
    await browserRequest<unknown>(`${BASE}/classes/${classId}/schedule-templates`, {
      method: "POST",
      body,
    }),
    scheduleTemplateSchema,
  );
}

/**
 * Revises a fixed schedule, which closes the running version and opens a new one
 * from the effective date. The answer is the new version, not the one replaced.
 */
export async function reviseScheduleTemplate(
  id: number,
  body: unknown,
): Promise<ScheduleTemplate> {
  return parseOne<ScheduleTemplate>(
    await browserRequest<unknown>(`${BASE}/schedule-templates/${id}`, { method: "PUT", body }),
    scheduleTemplateSchema,
  );
}

/** Replaces the whole teacher list of a fixed schedule, leaving the slot alone. */
export async function setScheduleTemplateTeachers(
  id: number,
  body: unknown,
): Promise<ScheduleTemplate> {
  return parseOne<ScheduleTemplate>(
    await browserRequest<unknown>(`${BASE}/schedule-templates/${id}/teachers`, {
      method: "PUT",
      body,
    }),
    scheduleTemplateSchema,
  );
}

/** Stops a fixed schedule from applying after a given date, without replacing it. */
export async function closeScheduleTemplate(
  id: number,
  endDate: string,
): Promise<ScheduleTemplate> {
  return parseOne<ScheduleTemplate>(
    await browserRequest<unknown>(`${BASE}/schedule-templates/${id}/close`, {
      method: "PATCH",
      body: { end_date: endDate },
    }),
    scheduleTemplateSchema,
  );
}

/** Removes a fixed schedule that has not started applying yet. */
export async function deleteScheduleTemplate(id: number): Promise<void> {
  await browserRequest<undefined>(`${BASE}/schedule-templates/${id}`, { method: "DELETE" });
}

/** Fetches the active rooms a slot may be placed in. */
export async function fetchRoomOptions(params: ListParams): Promise<Option[]> {
  return parseOne<Option[]>(
    await browserRequest<unknown>(`${ACADEMIC_BASE}/rooms/options`, { params }),
    optionListSchema,
  );
}

/** Fetches the working teachers a slot may be staffed with, in either role. */
export async function fetchTeacherOptions(params: ListParams): Promise<Option[]> {
  return parseOne<Option[]>(
    await browserRequest<unknown>(`${ACADEMIC_BASE}/teachers/options`, { params }),
    optionListSchema,
  );
}
