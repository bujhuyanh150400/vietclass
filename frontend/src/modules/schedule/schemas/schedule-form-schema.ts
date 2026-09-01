import { z } from "zod";

import type { ScheduleTeacherRole } from "../types/schedule";

/**
 * Form validation for every schedule screen, mirroring the API's own rules so a
 * mistake is caught before a request is sent. The API stays authoritative: it
 * repeats every one of these checks and adds the ones that depend on other
 * records — whether the room is available, whether every teacher still works
 * here, and whether the slot clashes with one already booked.
 */

/** A date the API accepts, in `YYYY-MM-DD`. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A time of day the API accepts, in `HH:MM`, which is what a time input produces. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The API caps a schedule's teacher list at twenty entries, one of them the leader. */
const MAX_ASSISTANTS = 19;

const requiredDate = z
  .string()
  .regex(DATE_PATTERN, { error: "Vui lòng chọn ngày hợp lệ." });

const optionalDate = z
  .string()
  .regex(DATE_PATTERN, { error: "Vui lòng chọn ngày hợp lệ." })
  .or(z.literal(""));

const requiredTime = z
  .string()
  .regex(TIME_PATTERN, { error: "Vui lòng nhập giờ theo dạng HH:MM." });

/** `0` Thứ 2 … `6` Chủ nhật, the API's own numbering rather than ISO `1`–`7`. */
const dayOfWeek = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3),
  z.literal(4), z.literal(5), z.literal(6),
]);

/** The teacher pickers shared by the slot form and the teachers-only form. */
const teacherShape = {
  main_teacher_id: z
    .number()
    .int()
    .min(1, { error: "Vui lòng chọn giáo viên chính." }),
  assistant_teacher_ids: z
    .array(z.number().int())
    .max(MAX_ASSISTANTS, { error: `Một lịch cố định có nhiều nhất ${MAX_ASSISTANTS} trợ giảng.` })
    .default([]),
};

/**
 * Everything a weekly slot declares, with both date fields present and lax.
 *
 * Creating requires `start_date` and revising requires `effective_date`; each mode
 * tightens its own field in the schema below. Keeping both here is what lets one
 * form component serve both modes, the same way the class form does.
 */
const slotShape = {
  ...teacherShape,
  room_id: z.number().int().min(1, { error: "Vui lòng chọn phòng học." }),
  day_of_week: dayOfWeek,
  start_time: requiredTime,
  end_time: requiredTime,
  start_date: optionalDate.default(""),
  effective_date: optionalDate.default(""),
  end_date: optionalDate.default(""),
};

/** One cross-field problem, named against the input a user has to correct. */
type CrossFieldIssue = { path: [string]; message: string };

/** The subset of a slot form the cross-field rules read. */
type SlotOrderValues = {
  start_time: string;
  end_time: string;
  end_date: string;
  main_teacher_id: number;
  assistant_teacher_ids: number[];
};

/**
 * Reports the ordering and teacher-list problems a slot form has, so they surface
 * on the field at fault instead of arriving later as a `422`.
 *
 * `endDateMessage` differs between the two write paths because the lower bound
 * does: creating compares against the start date, revising against the effective
 * date, and the API words its own refusal the same two ways.
 */
function slotOrderIssues(
  values: SlotOrderValues,
  startDate: string,
  endDateMessage: string,
): CrossFieldIssue[] {
  const issues: CrossFieldIssue[] = [];

  if (values.start_time !== "" && values.end_time !== "" && values.end_time <= values.start_time) {
    issues.push({ path: ["end_time"], message: "Giờ kết thúc phải sau giờ bắt đầu." });
  }

  if (values.end_date !== "" && startDate !== "" && values.end_date < startDate) {
    issues.push({ path: ["end_date"], message: endDateMessage });
  }

  issues.push(...teacherListIssues(values));

  return issues;
}

/**
 * Reports a teacher list that names the same person twice.
 *
 * The pickers already make "exactly one main teacher" the only shape a form can
 * express, and a multi-select cannot hold the same assistant twice, so the one
 * remaining way to break the rule is to promote somebody who is already an
 * assistant. This is immediate feedback, not enforcement: the Action owns both
 * rules and answers `422` whatever the form let through.
 */
function teacherListIssues(values: {
  main_teacher_id: number;
  assistant_teacher_ids: number[];
}): CrossFieldIssue[] {
  if (!values.assistant_teacher_ids.includes(values.main_teacher_id)) {
    return [];
  }

  return [
    {
      path: ["assistant_teacher_ids"],
      message: "Giáo viên chính không thể đồng thời là trợ giảng của cùng lịch này.",
    },
  ];
}

/**
 * The shape both slot modes share, and the type the one form component is written
 * against.
 *
 * Neither date field is declared required here, and the two mode schemas below add
 * their own requirement as a check rather than by tightening the field. That keeps
 * all three schemas structurally identical, which is what lets one `useForm` accept
 * either resolver — a schema whose *type* differed per mode could not be swapped
 * behind one form.
 */
export const scheduleTemplateFormSchema = z.object({ ...slotShape });

export type ScheduleTemplateFormInput = z.input<typeof scheduleTemplateFormSchema>;
export type ScheduleTemplateFormValues = z.output<typeof scheduleTemplateFormSchema>;

/** Opening a weekly slot for a class. */
export const scheduleTemplateCreateSchema = z
  .object({ ...slotShape })
  .superRefine((values, ctx) => {
    const issues: CrossFieldIssue[] = [];

    if (values.start_date === "") {
      issues.push({ path: ["start_date"], message: "Vui lòng chọn ngày bắt đầu áp dụng." });
    }

    issues.push(
      ...slotOrderIssues(
        values,
        values.start_date,
        "Ngày kết thúc không được trước ngày bắt đầu.",
      ),
    );

    for (const issue of issues) {
      ctx.addIssue({
        code: "custom",
        input: values,
        path: issue.path,
        message: issue.message,
        continue: true,
      });
    }
  });

/**
 * Revising a weekly slot, which closes the running version and opens a new one.
 *
 * `effective_date` is the day the new version starts applying, so it is the bound
 * `end_date` is measured against; `start_date` is not submitted on this path at all.
 */
export const scheduleTemplateReviseSchema = z
  .object({ ...slotShape })
  .superRefine((values, ctx) => {
    const issues: CrossFieldIssue[] = [];

    if (values.effective_date === "") {
      issues.push({ path: ["effective_date"], message: "Vui lòng chọn ngày hiệu lực." });
    }

    issues.push(
      ...slotOrderIssues(
        values,
        values.effective_date,
        "Ngày kết thúc không được trước ngày hiệu lực.",
      ),
    );

    for (const issue of issues) {
      ctx.addIssue({
        code: "custom",
        input: values,
        path: issue.path,
        message: issue.message,
        continue: true,
      });
    }
  });

/** Replacing the whole teacher list of a slot, leaving the slot itself alone. */
export const scheduleTeacherListSchema = z
  .object({ ...teacherShape })
  .superRefine((values, ctx) => {
    for (const issue of teacherListIssues(values)) {
      ctx.addIssue({
        code: "custom",
        input: values,
        path: issue.path,
        message: issue.message,
        continue: true,
      });
    }
  });

export type ScheduleTeacherListInput = z.input<typeof scheduleTeacherListSchema>;
export type ScheduleTeacherListValues = z.output<typeof scheduleTeacherListSchema>;

/** Closing a slot on a given last day, without replacing it. */
export const closeScheduleTemplateSchema = z.object({ end_date: requiredDate });

export type CloseScheduleTemplateInput = z.input<typeof closeScheduleTemplateSchema>;
export type CloseScheduleTemplateValues = z.output<typeof closeScheduleTemplateSchema>;

/**
 * Builds the teacher list the API expects from the two pickers a form shows.
 *
 * The form models the roles as separate controls because that is how a reader
 * thinks about them; the API models them as one list with a role per entry. This
 * is the single place that translation happens.
 */
export function toTeacherPayload(
  mainTeacherId: number,
  assistantTeacherIds: number[],
): { teacher_profile_id: number; role: ScheduleTeacherRole }[] {
  return [
    { teacher_profile_id: mainTeacherId, role: 0 },
    ...assistantTeacherIds.map((id) => ({ teacher_profile_id: id, role: 1 as ScheduleTeacherRole })),
  ];
}

/**
 * Converts an optional date field to what the API expects, since a cleared date
 * picker reports an empty string while the API stores `null`.
 */
export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
