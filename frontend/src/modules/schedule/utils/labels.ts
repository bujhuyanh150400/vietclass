import { format } from "date-fns";

import type {
  DayOfWeek,
  ScheduleEffectiveState,
  ScheduleTeacherRole,
  ScheduleTemplate,
} from "../types/schedule";

/**
 * Vietnamese labels for the schedule API's integer enums, and the small date and
 * time formatters the schedule screens read them with.
 *
 * They live here rather than on the API's PHP enums for the same reason the
 * academic labels do: the API reports stable numbers, and the words shown to a
 * reader are a presentation decision. Each map is exhaustive over its union, so
 * adding a value to the API without naming it here is a type error rather than a
 * blank cell on screen.
 */

/** The weekday a slot repeats on. `0` is Monday, matching the API rather than ISO. */
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  0: "Thứ 2",
  1: "Thứ 3",
  2: "Thứ 4",
  3: "Thứ 5",
  4: "Thứ 6",
  5: "Thứ 7",
  6: "Chủ nhật",
};

/** Every weekday in the order a Vietnamese week is read, for a picker. */
export const DAYS_OF_WEEK: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

/** The part a teacher plays on a slot. */
export const SCHEDULE_TEACHER_ROLE_LABELS: Record<ScheduleTeacherRole, string> = {
  0: "Giáo viên chính",
  1: "Trợ giảng",
};

/** Where a slot stands relative to today. */
export const SCHEDULE_STATE_LABELS: Record<ScheduleEffectiveState, string> = {
  upcoming: "Chưa áp dụng",
  active: "Đang áp dụng",
  ended: "Đã kết thúc",
};

/**
 * Returns today as the API writes dates.
 *
 * The date is read in the reader's own time zone rather than in UTC, because this
 * value decides which schedules are shown as running today and a UTC reading
 * would report yesterday for the first seven hours of every Vietnamese day.
 */
export function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Formats an API date (`YYYY-MM-DD`) the way dates are written in Vietnamese,
 * returning a dash when the API reported none.
 */
export function formatDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}

/**
 * Formats the weekly time range of a slot as one readable span.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

/**
 * Describes the date range a slot applies over, saying so in words when it has no
 * end date rather than leaving a dash a reader has to interpret.
 */
export function formatEffectiveRange(template: ScheduleTemplate): string {
  const from = formatDate(template.start_date);

  return template.end_date === null
    ? `Từ ${from}, chưa có ngày kết thúc`
    : `${from} – ${formatDate(template.end_date)}`;
}

/**
 * Works out whether a slot is already finished, running now, or still to come.
 *
 * This is derived here rather than read from the API's `is_closed`, which only
 * reports whether an `end_date` was set at all: a slot closed with a date still in
 * the future is `is_closed: true` while it is very much still being taught, and
 * labelling that "đã đóng" would tell a reader their class had stopped.
 */
export function scheduleEffectiveState(
  template: ScheduleTemplate,
  onDate: string = today(),
): ScheduleEffectiveState {
  if (template.end_date !== null && template.end_date < onDate) {
    return "ended";
  }

  if (template.start_date !== null && template.start_date > onDate) {
    return "upcoming";
  }

  return "active";
}

/**
 * Names the assistants of a slot for display, or says there are none.
 */
export function formatAssistantTeachers(template: ScheduleTemplate): string {
  const names = (template.assistant_teachers ?? [])
    .map((teacher) => teacher.teacher_name ?? `#${teacher.teacher_profile_id}`);

  return names.length === 0 ? "Không có" : names.join(", ");
}
