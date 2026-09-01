"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { AsyncSelectField } from "../components/async-select-field";
import { DateField } from "../components/date-field";
import { Field, fieldAria } from "../components/field";
import { useClassOptions } from "../hooks/use-classes";
import { useResourceForm } from "../hooks/use-resource-form";
import {
  emptyToNull,
  enrollmentUpdateSchema,
  leaveSchema,
  transferSchema,
  type EnrollmentUpdateInput,
  type EnrollmentUpdateValues,
  type LeaveInput,
  type LeaveValues,
  type TransferInput,
  type TransferValues,
} from "../schemas/academic-form-schema";
import type { Enrollment } from "../types/academic";

/** Today, as the API writes dates. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Corrects the join date, leave date, or note on one membership period.
 *
 * This is the only enrolment action that works on a period already closed, because
 * its purpose is fixing a record entered wrongly rather than changing what is
 * happening now.
 */
export function EditEnrollmentDialog({
  enrollment,
  onClose,
  submit,
}: {
  enrollment: Enrollment;
  onClose: () => void;
  submit: (body: unknown) => Promise<unknown>;
}) {
  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    EnrollmentUpdateInput,
    EnrollmentUpdateValues
  >({
    resolver: zodResolver(enrollmentUpdateSchema),
    defaultValues: {
      enrolled_at: enrollment.enrolled_at ?? today(),
      left_at: enrollment.left_at ?? "",
      note: enrollment.note ?? "",
    },
    fieldNames: ["enrolled_at", "left_at", "note"],
    submit: (values) =>
      submit({
        enrolled_at: values.enrolled_at,
        left_at: emptyToNull(values.left_at),
        note: emptyToNull(values.note),
      }),
    onSuccess: onClose,
    successMessage: "Đã lưu thông tin ghi danh.",
  });

  const errors = form.formState.errors;

  return (
    <EnrollmentDialogShell
      title="Sửa thông tin ghi danh"
      description={`Điều chỉnh thời gian học của ${enrollment.student_name ?? "học sinh"} trong lớp này.`}
      alertMessage={alertMessage}
      isSubmitting={isSubmitting}
      submitLabel="Lưu thay đổi"
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <Controller
        control={form.control}
        name="enrolled_at"
        render={({ field }) => (
          <DateField
            name="enrolled_at"
            label="Ngày vào lớp"
            required
            value={field.value}
            onChange={field.onChange}
            error={errors.enrolled_at?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="left_at"
        render={({ field }) => (
          <DateField
            name="left_at"
            label="Ngày rời lớp"
            hint="Để trống nghĩa là vẫn đang học."
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.left_at?.message}
          />
        )}
      />

      <Field name="note" label="Ghi chú" error={errors.note?.message}>
        <Textarea
          {...form.register("note")}
          {...fieldAria("note", errors.note?.message)}
          rows={3}
        />
      </Field>
    </EnrollmentDialogShell>
  );
}

/**
 * Moves a student to another class of the same subject.
 *
 * The picker offers every running class; the API is what refuses a target teaching
 * a different subject, and that refusal is shown here rather than filtered away,
 * because a class list narrowed silently would look like missing data.
 */
export function TransferEnrollmentDialog({
  enrollment,
  onClose,
  submit,
}: {
  enrollment: Enrollment;
  onClose: () => void;
  submit: (body: unknown) => Promise<unknown>;
}) {
  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    TransferInput,
    TransferValues
  >({
    resolver: zodResolver(transferSchema),
    defaultValues: { class_id: 0, left_at: today(), note: "" },
    fieldNames: ["class_id", "left_at", "note"],
    submit: (values) =>
      submit({
        class_id: values.class_id,
        left_at: values.left_at,
        note: emptyToNull(values.note),
      }),
    onSuccess: onClose,
    successMessage: `Đã chuyển ${enrollment.student_name ?? "học sinh"} sang lớp mới.`,
  });

  const errors = form.formState.errors;

  return (
    <EnrollmentDialogShell
      title="Chuyển lớp"
      description={`${enrollment.student_name ?? "Học sinh"} sẽ rời lớp này và vào lớp mới cùng ngày. Chỉ chuyển được sang lớp cùng môn học.`}
      alertMessage={alertMessage}
      isSubmitting={isSubmitting}
      submitLabel="Chuyển lớp"
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <Controller
        control={form.control}
        name="class_id"
        render={({ field }) => (
          <AsyncSelectField
            name="class_id"
            label="Lớp đích"
            required
            useOptions={useClassOptions}
            value={field.value === 0 ? undefined : field.value}
            onChange={field.onChange}
            filterOption={(option) => option.id !== enrollment.class_id}
            error={errors.class_id?.message}
            placeholder="Chọn lớp"
            searchPlaceholder="Tìm lớp học…"
            emptyMessage="Không tìm thấy lớp học phù hợp."
          />
        )}
      />

      <Controller
        control={form.control}
        name="left_at"
        render={({ field }) => (
          <DateField
            name="left_at"
            label="Ngày chuyển"
            required
            value={field.value}
            onChange={field.onChange}
            error={errors.left_at?.message}
          />
        )}
      />

      <Field name="note" label="Ghi chú cho lớp mới" error={errors.note?.message}>
        <Textarea
          {...form.register("note")}
          {...fieldAria("note", errors.note?.message)}
          rows={2}
        />
      </Field>
    </EnrollmentDialogShell>
  );
}

/**
 * Ends a student's membership of a class.
 *
 * A reason is required because the record is kept rather than removed, and a
 * closed period with no explanation is impossible to interpret later.
 */
export function LeaveClassDialog({
  enrollment,
  onClose,
  submit,
}: {
  enrollment: Enrollment;
  onClose: () => void;
  submit: (body: unknown) => Promise<unknown>;
}) {
  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    LeaveInput,
    LeaveValues
  >({
    resolver: zodResolver(leaveSchema),
    defaultValues: { left_at: today(), reason: "" },
    fieldNames: ["left_at", "reason"],
    submit: (values) => submit(values),
    onSuccess: onClose,
    successMessage: `Đã cho ${enrollment.student_name ?? "học sinh"} nghỉ lớp.`,
  });

  const errors = form.formState.errors;

  return (
    <EnrollmentDialogShell
      title="Cho nghỉ lớp"
      description={`${enrollment.student_name ?? "Học sinh"} sẽ rời lớp, nhưng dữ liệu của giai đoạn đã học vẫn được giữ nguyên.`}
      alertMessage={alertMessage}
      isSubmitting={isSubmitting}
      submitLabel="Cho nghỉ"
      destructive
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <Controller
        control={form.control}
        name="left_at"
        render={({ field }) => (
          <DateField
            name="left_at"
            label="Ngày nghỉ"
            required
            value={field.value}
            onChange={field.onChange}
            error={errors.left_at?.message}
          />
        )}
      />

      <Field name="reason" label="Lý do nghỉ" required error={errors.reason?.message}>
        <Textarea
          {...form.register("reason")}
          {...fieldAria("reason", errors.reason?.message)}
          rows={3}
        />
      </Field>
    </EnrollmentDialogShell>
  );
}

/**
 * Renders the frame the three enrolment dialogs share: the heading, the form-level
 * message when the API refuses, the fields, and the controls.
 */
function EnrollmentDialogShell({
  title,
  description,
  alertMessage,
  isSubmitting,
  submitLabel,
  destructive = false,
  onSubmit,
  onClose,
  children,
}: {
  title: string;
  description: string;
  alertMessage: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  destructive?: boolean;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {alertMessage === null ? null : (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">{children}</div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
