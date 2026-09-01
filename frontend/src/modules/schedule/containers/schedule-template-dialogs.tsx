"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";

import { DateField } from "@/components/shared/date-field";
import { useResourceForm } from "@/hooks/use-resource-form";

import { ScheduleDialogShell } from "../components/schedule-dialog-shell";
import { TeacherRosterField } from "../components/teacher-roster-field";
import {
  useCloseScheduleTemplate,
  useSetScheduleTemplateTeachers,
  useTeacherOptions,
} from "../hooks/use-schedule-templates";
import {
  closeScheduleTemplateSchema,
  scheduleTeacherListSchema,
  toTeacherPayload,
  type CloseScheduleTemplateInput,
  type CloseScheduleTemplateValues,
  type ScheduleTeacherListInput,
  type ScheduleTeacherListValues,
} from "../schemas/schedule-form-schema";
import type { ScheduleTemplate } from "../types/schedule";
import { DAY_OF_WEEK_LABELS, formatDate, formatTimeRange, today } from "../utils/labels";

/**
 * The teachers endpoint reports its refusals against the list as a whole rather
 * than against one input, so this form declares no fields to map them onto and
 * shows them as the form-level message.
 */
const NO_MAPPED_FIELDS = [] as const;

/** Names one slot the way a reader recognises it in the table. */
function describeSlot(template: ScheduleTemplate): string {
  return `${DAY_OF_WEEK_LABELS[template.day_of_week]}, ${formatTimeRange(template.start_time, template.end_time)}`;
}

/**
 * Replaces the whole teacher list of one slot without touching the slot itself.
 *
 * Who teaches a slot is not part of what defines it, so this is the one change to a
 * running schedule that does not open a new version: the weekday, time, room and
 * date range stay exactly as they were. The list is always sent whole — the API
 * refuses a partial one outright rather than leaving a schedule half-staffed.
 */
export function ScheduleTemplateTeachersDialog({
  template,
  onClose,
}: {
  template: ScheduleTemplate;
  onClose: () => void;
}) {
  const setTeachers = useSetScheduleTemplateTeachers();
  const assistants = template.assistant_teachers ?? [];

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    ScheduleTeacherListInput,
    ScheduleTeacherListValues
  >({
    resolver: zodResolver(scheduleTeacherListSchema),
    defaultValues: {
      main_teacher_id: template.main_teacher?.teacher_profile_id ?? 0,
      assistant_teacher_ids: assistants.map((teacher) => teacher.teacher_profile_id),
    },
    fieldNames: NO_MAPPED_FIELDS,
    submit: (values) =>
      setTeachers.mutateAsync({
        id: template.id,
        body: { teachers: toTeacherPayload(values.main_teacher_id, values.assistant_teacher_ids) },
      }),
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
      title="Đổi giáo viên"
      description={`Thay danh sách giáo viên của lịch ${describeSlot(template)}.`}
      notice={
        <>
          Đổi giáo viên <strong>không</strong> tạo bản lịch mới: thứ, giờ, phòng và khoảng hiệu lực
          giữ nguyên. Danh sách bên dưới sẽ <strong>thay thế toàn bộ</strong> danh sách hiện tại.
        </>
      }
      alertMessage={alertMessage}
      isSubmitting={isSubmitting}
      submitLabel="Lưu danh sách giáo viên"
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <TeacherRosterField
        useOptions={useTeacherOptions}
        mainTeacherId={mainTeacherId}
        assistantTeacherIds={assistantTeacherIds}
        onMainTeacherChange={(id) => form.setValue("main_teacher_id", id, { shouldValidate: true })}
        onAssistantTeachersChange={(ids) =>
          form.setValue("assistant_teacher_ids", ids, { shouldValidate: true })
        }
        mainTeacherError={errors.main_teacher_id?.message}
        assistantTeachersError={errors.assistant_teacher_ids?.message}
        mainTeacherLabel={template.main_teacher?.teacher_name ?? undefined}
        assistantTeacherLabels={assistantLabels}
      />
    </ScheduleDialogShell>
  );
}

/**
 * Stops one slot from applying after a chosen day, without replacing it.
 *
 * This is the path for a class that simply stops having that lesson — nothing takes
 * its place, so there is no new version to open. The lessons already written under
 * the slot keep their room and their time, which is why closing a schedule does not
 * free the room for those dates.
 */
export function CloseScheduleTemplateDialog({
  template,
  onClose,
}: {
  template: ScheduleTemplate;
  onClose: () => void;
}) {
  const close = useCloseScheduleTemplate();

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    CloseScheduleTemplateInput,
    CloseScheduleTemplateValues
  >({
    resolver: zodResolver(closeScheduleTemplateSchema),
    defaultValues: { end_date: template.end_date ?? today() },
    fieldNames: ["end_date"],
    submit: (values) => close.mutateAsync({ id: template.id, endDate: values.end_date }),
    onSuccess: onClose,
  });

  const errors = form.formState.errors;

  return (
    <ScheduleDialogShell
      title="Đóng lịch cố định"
      description={`Lịch ${describeSlot(template)} sẽ thôi áp dụng sau ngày bạn chọn.`}
      notice={
        <>
          Đóng lịch chỉ đặt <strong>ngày kết thúc</strong>; dòng lịch vẫn ở lại trong danh sách như
          lịch sử của lớp. Những buổi học đã được ghi trước đó vẫn giữ nguyên phòng và giờ.
        </>
      }
      alertMessage={alertMessage}
      isSubmitting={isSubmitting}
      submitLabel="Đóng lịch"
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <Controller
        control={form.control}
        name="end_date"
        render={({ field }) => (
          <DateField
            name="end_date"
            label="Ngày áp dụng cuối cùng"
            required
            hint={`Không được trước ngày lịch bắt đầu áp dụng (${formatDate(template.start_date)}).`}
            value={field.value}
            onChange={field.onChange}
            error={errors.end_date?.message}
          />
        )}
      />
    </ScheduleDialogShell>
  );
}
