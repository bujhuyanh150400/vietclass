"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";

import { AsyncSelectField } from "@/components/shared/async-select-field";
import { DateField } from "@/components/shared/date-field";
import { SelectField } from "@/components/shared/select-field";
import { TimeField } from "@/components/shared/time-field";
import { useResourceForm } from "@/hooks/use-resource-form";

import { ScheduleDialogShell } from "../components/schedule-dialog-shell";
import { TeacherRosterField } from "../components/teacher-roster-field";
import {
  useCreateScheduleTemplate,
  useReviseScheduleTemplate,
  useRoomOptions,
  useTeacherOptions,
} from "../hooks/use-schedule-templates";
import {
  emptyToNull,
  scheduleTemplateCreateSchema,
  scheduleTemplateReviseSchema,
  toTeacherPayload,
  type ScheduleTemplateFormInput,
  type ScheduleTemplateFormValues,
} from "../schemas/schedule-form-schema";
import type { ScheduleTemplate } from "../types/schedule";
import { DAYS_OF_WEEK, DAY_OF_WEEK_LABELS, today } from "../utils/labels";

/**
 * Fields the API may report validation messages for.
 *
 * `teachers` is absent because the form has no field of that name: it splits the
 * list into a main-teacher picker and an assistant picker, so a refusal about the
 * list as a whole has no single input to land on and is shown as the form-level
 * message instead.
 */
const FIELDS = [
  "room_id",
  "day_of_week",
  "start_time",
  "end_time",
  "start_date",
  "effective_date",
  "end_date",
] as const;

/** Every weekday, in the order a Vietnamese week is read. */
const DAY_CHOICES = DAYS_OF_WEEK.map((day) => ({
  value: day,
  label: DAY_OF_WEEK_LABELS[day],
}));

/**
 * Coordinates declaring one weekly slot of a class, either as a new schedule or as
 * a revision of an existing one.
 *
 * Revising is not an in-place edit, and the dialog says so before anything is
 * submitted: the API closes the running version the day before the effective date
 * and opens a new one from it. A reader who is not told that reads the extra row in
 * the list afterwards as their history having been destroyed, so the explanation is
 * part of the feature rather than a nicety.
 *
 * Both modes share one field shape; only the date field differs, so only the
 * matching resolver is applied — creating demands `start_date`, revising demands
 * `effective_date`.
 */
export function ScheduleTemplateFormDialog({
  classId,
  template,
  onClose,
}: {
  classId: number;
  /** The slot being revised, or nothing when a new slot is being opened. */
  template?: ScheduleTemplate;
  onClose: () => void;
}) {
  const isRevising = template !== undefined;
  const create = useCreateScheduleTemplate(classId);
  const revise = useReviseScheduleTemplate();

  const assistants = template?.assistant_teachers ?? [];

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    ScheduleTemplateFormInput,
    ScheduleTemplateFormValues
  >({
    resolver: zodResolver(isRevising ? scheduleTemplateReviseSchema : scheduleTemplateCreateSchema),
    defaultValues: {
      room_id: template?.room_id ?? 0,
      day_of_week: template?.day_of_week ?? 0,
      start_time: template?.start_time ?? "",
      end_time: template?.end_time ?? "",
      start_date: isRevising ? "" : today(),
      effective_date: isRevising ? today() : "",
      end_date: template?.end_date ?? "",
      main_teacher_id: template?.main_teacher?.teacher_profile_id ?? 0,
      assistant_teacher_ids: assistants.map((teacher) => teacher.teacher_profile_id),
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const slot = {
        room_id: values.room_id,
        day_of_week: values.day_of_week,
        start_time: values.start_time,
        end_time: values.end_time,
        end_date: emptyToNull(values.end_date),
        teachers: toTeacherPayload(values.main_teacher_id, values.assistant_teacher_ids),
      };

      // The revise path carries `effective_date` and no `start_date`: the day the
      // new version starts applying is also the day the old one is closed before.
      return isRevising
        ? revise.mutateAsync({
            id: template.id,
            body: { ...slot, effective_date: values.effective_date },
          })
        : create.mutateAsync({ ...slot, start_date: values.start_date });
    },
    onSuccess: onClose,
  });

  const errors = form.formState.errors;
  const mainTeacherId = form.watch("main_teacher_id");
  const assistantTeacherIds = form.watch("assistant_teacher_ids") ?? [];

  const assistantLabels = Object.fromEntries(
    assistants.map((teacher) => [
      teacher.teacher_profile_id,
      teacher.teacher_name ?? `#${teacher.teacher_profile_id}`,
    ]),
  );

  return (
    <ScheduleDialogShell
      wide
      title={isRevising ? "Sửa lịch cố định" : "Thêm lịch cố định"}
      description={
        isRevising
          ? "Đổi thứ, giờ, phòng hoặc giáo viên của buổi học hằng tuần này."
          : "Khai một buổi học hằng tuần của lớp: thứ, khung giờ, phòng học và giáo viên."
      }
      notice={
        isRevising ? (
          <>
            Lịch cố định không được sửa tại chỗ. Khi bạn lưu, bản đang chạy sẽ được{" "}
            <strong>đóng lại vào ngày liền trước ngày hiệu lực</strong>, và một{" "}
            <strong>bản mới</strong> mang thông tin bên dưới <strong>bắt đầu áp dụng từ ngày
            hiệu lực</strong>. Bản cũ vẫn nằm trong danh sách lịch của lớp như một dòng lịch sử —
            không có gì bị mất.
          </>
        ) : undefined
      }
      alertMessage={alertMessage}
      isSubmitting={isSubmitting}
      submitLabel={isRevising ? "Lưu bản mới" : "Tạo lịch cố định"}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <Controller
        control={form.control}
        name="day_of_week"
        render={({ field }) => (
          <SelectField
            name="day_of_week"
            label="Thứ trong tuần"
            required
            value={field.value}
            choices={DAY_CHOICES}
            onChange={field.onChange}
            error={errors.day_of_week?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="room_id"
        render={({ field }) => (
          <AsyncSelectField
            name="room_id"
            label="Phòng học"
            required
            useOptions={useRoomOptions}
            value={field.value === 0 ? undefined : field.value}
            onChange={field.onChange}
            selectedLabel={template?.room_name ?? undefined}
            error={errors.room_id?.message}
            hint="Chỉ hiển thị phòng đang hoạt động."
            placeholder="Chọn phòng học"
            searchPlaceholder="Tìm phòng học…"
            emptyMessage="Không tìm thấy phòng học phù hợp."
          />
        )}
      />

      <Controller
        control={form.control}
        name="start_time"
        render={({ field }) => (
          <TimeField
            name="start_time"
            label="Giờ bắt đầu"
            required
            value={field.value}
            onChange={field.onChange}
            error={errors.start_time?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="end_time"
        render={({ field }) => (
          <TimeField
            name="end_time"
            label="Giờ kết thúc"
            required
            value={field.value}
            onChange={field.onChange}
            error={errors.end_time?.message}
          />
        )}
      />

      {isRevising ? (
        <Controller
          control={form.control}
          name="effective_date"
          render={({ field }) => (
            <DateField
              name="effective_date"
              label="Ngày hiệu lực"
              required
              hint="Bản mới áp dụng từ ngày này; bản cũ đóng vào ngày liền trước. Không chọn ngày trong quá khứ."
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.effective_date?.message}
            />
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <DateField
              name="start_date"
              label="Ngày bắt đầu áp dụng"
              required
              hint="Không được trước ngày khai giảng của lớp."
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.start_date?.message}
            />
          )}
        />
      )}

      <Controller
        control={form.control}
        name="end_date"
        render={({ field }) => (
          <DateField
            name="end_date"
            label="Ngày kết thúc"
            hint="Để trống nghĩa là chạy tới khi lớp kết thúc."
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.end_date?.message}
          />
        )}
      />

      {/* The two pickers are read and written together: which people may be offered
          as assistants depends on who the main teacher currently is. */}
      <TeacherRosterField
        useOptions={useTeacherOptions}
        mainTeacherId={mainTeacherId}
        assistantTeacherIds={assistantTeacherIds}
        onMainTeacherChange={(id) =>
          form.setValue("main_teacher_id", id, { shouldValidate: true })
        }
        onAssistantTeachersChange={(ids) =>
          form.setValue("assistant_teacher_ids", ids, { shouldValidate: true })
        }
        mainTeacherError={errors.main_teacher_id?.message}
        assistantTeachersError={errors.assistant_teacher_ids?.message}
        mainTeacherLabel={template?.main_teacher?.teacher_name ?? undefined}
        assistantTeacherLabels={assistantLabels}
      />
    </ScheduleDialogShell>
  );
}
