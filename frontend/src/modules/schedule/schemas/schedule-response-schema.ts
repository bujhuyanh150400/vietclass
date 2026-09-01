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
