"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";

import { PageHeader } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";

import { Field, fieldAria } from "../components/field";
import { FormShell } from "../components/form-shell";
import { SelectField } from "../components/select-field";
import { useCreateClass, useUpdateClass } from "../hooks/use-classes";
import { useResourceForm } from "../hooks/use-resource-form";
import { useSubjectOptions } from "../hooks/use-subjects";
import { useTeacherOptions } from "../hooks/use-teachers";
import {
  classCreateSchema,
  classEditSchema,
  emptyToNull,
  type ClassFormInput,
  type ClassFormValues,
} from "../schemas/academic-form-schema";
import type { SchoolClass } from "../types/academic";
import { GRADE_LEVELS, GRADE_LEVEL_LABELS } from "../utils/labels";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "code",
  "name",
  "subject_id",
  "teacher_id",
  "grade_level",
  "max_students",
  "start_at",
  "end_at",
] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/dashboard/academic/classes";

const GRADE_CHOICES = GRADE_LEVELS.map((grade) => ({
  value: grade,
  label: GRADE_LEVEL_LABELS[grade],
}));

/**
 * Coordinates creating and editing a class.
 *
 * The subject and teacher pickers offer only what a class may actually use — a
 * subject still open, a teacher still employed — so a choice that would be refused
 * is never presented in the first place.
 *
 * When editing, the class code and opening date are shown but disabled: they are
 * fixed once the class exists, and hiding them would leave the reader wondering
 * where they went.
 */
export function ClassFormContainer({ schoolClass }: { schoolClass?: SchoolClass }) {
  const router = useRouter();
  const isEditing = schoolClass !== undefined;
  const create = useCreateClass();
  const update = useUpdateClass(schoolClass?.id ?? 0);

  const subjects = useSubjectOptions();
  const teachers = useTeacherOptions();

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    ClassFormInput,
    ClassFormValues
  >({
    // Both modes share one field shape; only creating demands the code and the
    // opening date, so only creating gets the stricter resolver.
    resolver: zodResolver(isEditing ? classEditSchema : classCreateSchema),
    defaultValues: {
      code: schoolClass?.code ?? "",
      name: schoolClass?.name ?? "",
      subject_id: schoolClass?.subject_id ?? 0,
      teacher_id: schoolClass?.teacher_id ?? 0,
      grade_level: schoolClass?.grade_level ?? 0,
      max_students: schoolClass?.max_students ?? 20,
      start_at: schoolClass?.start_at ?? "",
      end_at: schoolClass?.end_at ?? "",
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const shared = {
        name: values.name,
        subject_id: values.subject_id,
        teacher_id: values.teacher_id,
        grade_level: values.grade_level,
        max_students: values.max_students,
        end_at: emptyToNull(values.end_at),
      };

      if (isEditing) {
        return update.mutateAsync(shared);
      }

      // The create resolver already required both; the fallbacks only satisfy the
      // shared form type, whose two fixed fields are optional for the edit mode.
      return create.mutateAsync({
        ...shared,
        code: values.code ?? "",
        start_at: values.start_at ?? "",
      });
    },
    onSuccess: () => {
      router.push(LIST_HREF);
      router.refresh();
    },
  });

  const errors = form.formState.errors;

  const subjectChoices = (subjects.data ?? []).map((option) => ({
    value: option.id,
    label: option.label,
  }));
  const teacherChoices = (teachers.data ?? []).map((option) => ({
    value: option.id,
    label: option.label,
  }));

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title={isEditing ? "Sửa lớp học" : "Thêm lớp học"}
        description={
          isEditing
            ? "Mã lớp và ngày khai giảng không đổi được sau khi tạo."
            : "Chỉ chọn được môn học đang mở và giáo viên đang làm việc."
        }
      />

      <FormShell
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Lưu thay đổi" : "Tạo lớp học"}
        cancelHref={LIST_HREF}
      >
        <Field name="name" label="Tên lớp" required error={errors.name?.message}>
          <Input
            {...form.register("name")}
            {...fieldAria("name", errors.name?.message)}
            placeholder="Ví dụ: Toán 9A"
            autoComplete="off"
          />
        </Field>

        <Field
          name="code"
          label="Mã lớp"
          required={!isEditing}
          hint={isEditing ? "Không đổi được sau khi tạo." : "Duy nhất trong toàn hệ thống."}
          error={errors.code?.message}
        >
          <Input
            {...form.register("code")}
            {...fieldAria("code", errors.code?.message)}
            disabled={isEditing}
            placeholder="TOAN-9A"
            autoComplete="off"
          />
        </Field>

        <Controller
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <SelectField
              name="subject_id"
              label="Môn học"
              required
              value={field.value === 0 ? undefined : field.value}
              choices={subjectChoices}
              onChange={field.onChange}
              error={errors.subject_id?.message}
              placeholder={subjects.isPending ? "Đang tải…" : "Chọn môn học"}
              hint="Chỉ hiển thị môn học đang mở."
            />
          )}
        />

        <Controller
          control={form.control}
          name="teacher_id"
          render={({ field }) => (
            <SelectField
              name="teacher_id"
              label="Giáo viên phụ trách"
              required
              value={field.value === 0 ? undefined : field.value}
              choices={teacherChoices}
              onChange={field.onChange}
              error={errors.teacher_id?.message}
              placeholder={teachers.isPending ? "Đang tải…" : "Chọn giáo viên"}
              hint="Chỉ hiển thị giáo viên đang làm việc."
            />
          )}
        />

        <Controller
          control={form.control}
          name="grade_level"
          render={({ field }) => (
            <SelectField
              name="grade_level"
              label="Khối lớp"
              required
              value={field.value}
              choices={GRADE_CHOICES}
              onChange={field.onChange}
              error={errors.grade_level?.message}
            />
          )}
        />

        <Field
          name="max_students"
          label="Sĩ số tối đa"
          required
          hint={
            isEditing
              ? `Không đặt thấp hơn ${schoolClass.active_students_count ?? 0} học sinh đang học.`
              : undefined
          }
          error={errors.max_students?.message}
        >
          <Input
            {...form.register("max_students", { valueAsNumber: true })}
            {...fieldAria("max_students", errors.max_students?.message)}
            type="number"
            min={1}
          />
        </Field>

        <Field
          name="start_at"
          label="Ngày khai giảng"
          required={!isEditing}
          hint={isEditing ? "Không đổi được sau khi tạo." : undefined}
          error={errors.start_at?.message}
        >
          <Input
            {...form.register("start_at")}
            {...fieldAria("start_at", errors.start_at?.message)}
            type="date"
            disabled={isEditing}
          />
        </Field>

        <Field
          name="end_at"
          label="Ngày kết thúc"
          hint="Không bắt buộc."
          error={errors.end_at?.message}
        >
          <Input
            {...form.register("end_at")}
            {...fieldAria("end_at", errors.end_at?.message, "Không bắt buộc.")}
            type="date"
          />
        </Field>
      </FormShell>
    </div>
  );
}
