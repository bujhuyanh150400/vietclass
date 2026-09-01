/**
 * Wire types for the schedule API.
 *
 * Field names stay in the API's snake_case because they are part of the wire
 * contract, matching how the academic and identity modules treat theirs.
 */

/**
 * The weekday a fixed schedule repeats on.
 *
 * `0` is **Monday** and `6` is **Sunday**, which is the API's own numbering and
 * deliberately not ISO 8601's `1`–`7`. Mirroring it any other way would silently
 * shift every schedule by one day, so the offset is never applied on this side.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** The part a teacher plays on a fixed schedule: `0` leads it, `1` assists. */
export type ScheduleTeacherRole = 0 | 1;

/**
 * One teacher's assignment to a fixed schedule.
 *
 * The role travels with the person rather than being implied by which list they
 * appear in, so a reader of the flat list still knows who leads it.
 */
export type ScheduleTemplateTeacher = {
  teacher_profile_id: number;
  teacher_name?: string | null;
  role: ScheduleTeacherRole;
  role_label: string;
};

/**
 * One weekly slot of a class: a weekday, a time range, a room, the people
 * teaching it, and the date range it applies over.
 *
 * There is no `teacher_id`: teachers are always a list with exactly one main
 * teacher and any number of assistants. `end_date` being `null` means the slot
 * runs until the class itself ends.
 *
 * The teacher lists and `room_name` are optional because the API attaches them
 * only when it loaded the relations. Every endpoint the screens call does load
 * them, so in practice they are present; keeping them optional is what stops a
 * future read path from becoming a type lie.
 */
export type ScheduleTemplate = {
  id: number;
  class_id: number;
  day_of_week: DayOfWeek;
  day_of_week_label: string;
  start_time: string;
  end_time: string;
  room_id: number;
  room_name?: string | null;
  start_date: string | null;
  end_date: string | null;
  is_closed: boolean;
  main_teacher?: ScheduleTemplateTeacher | null;
  assistant_teachers?: ScheduleTemplateTeacher[];
  teachers?: ScheduleTemplateTeacher[];
  created_at: string | null;
  updated_at: string | null;
};

/** One entry in a combobox, as the option endpoints report it. */
export type Option = {
  id: number;
  label: string;
};

/**
 * Where a fixed schedule stands relative to today, worked out from its own dates.
 *
 * The API reports `is_closed`, which only says whether an `end_date` was set at
 * all — a slot closed with a date still in the future is reported closed while it
 * is still being taught. A reader needs the three states below instead.
 */
export type ScheduleEffectiveState = "upcoming" | "active" | "ended";
