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
 * What kind of occasion a session is: `0` a lesson of the regular schedule, `1` a
 * make-up lesson, `2` an extra one. Only `0` can occur in this phase, because every
 * session is still projected from a fixed schedule; the other two are typed now so
 * the payload never arrives with a value this side refuses.
 */
export type ScheduleType = 0 | 1 | 2;

/**
 * Where a session stands in its own life: `0` not held yet, `1` held, `2` cancelled.
 *
 * No clock advances these. A session whose date has passed stays `0` until somebody
 * records what happened, which is what lets a missed entry be repaired later.
 */
export type ScheduleStatus = 0 | 1 | 2;

/**
 * One teacher on one session, with the role they hold on that day.
 *
 * `teacher_name` is not optional here, unlike on a fixed schedule: the calendar read
 * always loads the person behind the identifier, because a cell reading `#7` where a
 * teacher belongs is a cell nobody can act on.
 *
 * `replaces_profile_id` names who this person stood in for, and is always `null` in
 * this phase — a fixed schedule cannot express a substitution, and nothing can write
 * one yet.
 */
export type ScheduleSessionTeacher = {
  teacher_profile_id: number;
  teacher_name: string;
  role: ScheduleTeacherRole;
  role_label: string;
  replaces_profile_id: number | null;
};

/**
 * One session on the calendar, whether or not a row has been written for it.
 *
 * The API reports both kinds through this single shape on purpose, because whether a
 * lesson has been materialised is a storage fact rather than something the reader
 * asked about. **`id` is the one field that differs**: a projected session — one
 * nobody has touched — has no row and therefore carries `null`, and its identity is
 * the `template_id` and `date` pair instead. Reading `id` as a number would be a type
 * lie that breaks on the majority of a normal week, so it is nullable here and every
 * consumer works from `isWrittenSession` rather than guessing what a null means.
 *
 * `class_code` and `class_name` travel separately rather than pre-joined, so a label
 * can be composed without losing either half; both are `null` exactly when `class_id`
 * is. The subject, room and teacher names are always present, and they come from the
 * API rather than from the option endpoints, which list only what may still be chosen
 * — a calendar shows lessons in rooms under maintenance and lessons of classes that
 * have finished, and those would be left nameless.
 */
export type ScheduleSession = {
  id: number | null;
  template_id: number | null;
  class_id: number | null;
  class_code: string | null;
  class_name: string | null;
  subject_id: number;
  subject_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room_id: number;
  room_name: string;
  schedule_type: ScheduleType;
  schedule_type_label: string;
  status: ScheduleStatus;
  status_label: string;
  is_customized: boolean;
  note: string | null;
  teachers: ScheduleSessionTeacher[];
};

/**
 * The window and the narrowing one calendar read asks for.
 *
 * Both bounds are required because the API has no default window: the same request
 * would mean a different thing on a different day, so nothing guesses one. The three
 * filters are optional, and `teacherId` is a `teacher_profile_id` matched in both
 * roles.
 */
export type ScheduleSessionQuery = {
  from: string;
  to: string;
  classId?: number;
  teacherId?: number;
  roomId?: number;
};

/**
 * How a session is drawn on the calendar, worked out from `status` and
 * `is_customized` rather than from whether it has an `id`.
 *
 * - `projected` — nobody has touched this lesson; it is what the fixed schedule says.
 * - `written` — somebody has edited or recorded it, so it no longer merely repeats.
 * - `cancelled` — it will not be taught, and it must not read as an ordinary lesson.
 */
export type SessionAppearance = "projected" | "written" | "cancelled";

/**
 * Where a fixed schedule stands relative to today, worked out from its own dates.
 *
 * The API reports `is_closed`, which only says whether an `end_date` was set at
 * all — a slot closed with a date still in the future is reported closed while it
 * is still being taught. A reader needs the three states below instead.
 */
export type ScheduleEffectiveState = "upcoming" | "active" | "ended";
