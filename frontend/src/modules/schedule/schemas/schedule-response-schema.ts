import { z } from "zod";

/**
 * Validates every schedule payload Laravel returns.
 *
 * The forwarding route is transport only — it hands the API's answer straight
 * back — so this is the boundary that decides whether a payload is usable. A
 * shape that does not match becomes a service failure rather than a screen of
 * blanks.
 */

/** The weekday numbering the API stores: `0` Monday … `6` Sunday, not ISO `1`–`7`. */
const dayOfWeek = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3),
  z.literal(4), z.literal(5), z.literal(6),
]);

/** `0` main teacher, `1` assistant. */
const scheduleTeacherRole = z.union([z.literal(0), z.literal(1)]);

const timestamps = {
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
};

/** One entry in a combobox, in the shape every option endpoint reports. */
export const optionSchema = z.object({
  id: z.number().int(),
  label: z.string(),
});

/** A list of combobox entries. */
export const optionListSchema = z.array(optionSchema);

/** One teacher's assignment to a fixed schedule, with the role they hold on it. */
export const scheduleTemplateTeacherSchema = z.object({
  teacher_profile_id: z.number().int(),
  teacher_name: z.string().nullable().optional(),
  role: scheduleTeacherRole,
  role_label: z.string(),
});

/** One weekly slot of a class. */
export const scheduleTemplateSchema = z.object({
  id: z.number().int(),
  class_id: z.number().int(),
  day_of_week: dayOfWeek,
  day_of_week_label: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  room_id: z.number().int(),
  room_name: z.string().nullable().optional(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  is_closed: z.boolean(),
  main_teacher: scheduleTemplateTeacherSchema.nullable().optional(),
  assistant_teachers: z.array(scheduleTemplateTeacherSchema).optional(),
  teachers: z.array(scheduleTemplateTeacherSchema).optional(),
  ...timestamps,
});

/**
 * Every fixed schedule of one class.
 *
 * This is a plain array rather than a page: the API answers the list endpoint with
 * a `data` envelope carrying no `meta`, because a class has a handful of weekly
 * slots and the weekday-then-time order matters more than paging would.
 */
export const scheduleTemplateListSchema = z.array(scheduleTemplateSchema);

/** `0` a lesson of the regular schedule, `1` a make-up lesson, `2` an extra one. */
const scheduleType = z.union([z.literal(0), z.literal(1), z.literal(2)]);

/** `0` not held yet, `1` held, `2` cancelled. */
const scheduleStatus = z.union([z.literal(0), z.literal(1), z.literal(2)]);

/**
 * One teacher on one session.
 *
 * `teacher_name` is required rather than optional, unlike on a fixed schedule: the
 * calendar read always resolves the person, so a payload without the name is a
 * contract break and not a relation that happened not to be loaded.
 */
export const scheduleSessionTeacherSchema = z.object({
  teacher_profile_id: z.number().int(),
  teacher_name: z.string(),
  role: scheduleTeacherRole,
  role_label: z.string(),
  replaces_profile_id: z.number().int().nullable(),
});

/**
 * One session on the calendar, projected or written.
 *
 * **`id` is nullable and that is the point.** A projected session — a lesson the fixed
 * schedule casts onto a date that nobody has touched — has no row behind it, so the
 * API reports `null` rather than inventing an identifier; its identity is the
 * `template_id` and `date` pair. Declaring `id` as a plain number here would reject
 * most of a normal week as malformed and blank the calendar, so this is the single
 * easiest place in the module to get wrong.
 *
 * `template_id` and `class_id` are nullable for the opposite reason: a written make-up
 * or extra lesson of a later phase comes from no fixed schedule and may belong to no
 * class. `class_code` and `class_name` are `null` exactly when `class_id` is. The
 * subject, room and teacher names are always reported, because resolving them from the
 * option endpoints would leave rooms under maintenance and finished classes nameless.
 */
export const scheduleSessionSchema = z.object({
  id: z.number().int().nullable(),
  template_id: z.number().int().nullable(),
  class_id: z.number().int().nullable(),
  class_code: z.string().nullable(),
  class_name: z.string().nullable(),
  subject_id: z.number().int(),
  subject_name: z.string(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  room_id: z.number().int(),
  room_name: z.string(),
  schedule_type: scheduleType,
  schedule_type_label: z.string(),
  status: scheduleStatus,
  status_label: z.string(),
  is_customized: z.boolean(),
  note: z.string().nullable(),
  teachers: z.array(scheduleSessionTeacherSchema),
});

/**
 * Every session in one date window.
 *
 * A plain array rather than a page: the API answers this endpoint with a `data`
 * envelope carrying no `meta`, because a reader who asked for a window wants the whole
 * window, and paging a calendar would cut it into meaningless pieces. What keeps the
 * answer finite is the width of the window, not pagination.
 */
export const scheduleSessionListSchema = z.array(scheduleSessionSchema);
