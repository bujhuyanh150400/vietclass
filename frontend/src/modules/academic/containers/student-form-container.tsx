"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";

import { PageHeader } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { DateField } from "../components/date-field";
import { Field, fieldAria } from "../components/field";
import { FormShell } from "../components/form-shell";
import { SelectField } from "../components/select-field";
import { useResourceForm } from "../hooks/use-resource-form";
import { useCreateStudent, useUpdateStudent } from "../hooks/use-students";
import {
  emptyToNull,
  studentCreateSchema,
  studentEditSchema,
  type StudentFormInput,
  type StudentFormValues,
} from "../schemas/academic-form-schema";
import type { Student } from "../types/academic";
import { GENDER_LABELS, GRADE_LEVELS, GRADE_LEVEL_LABELS, STUDENT_STATUS_LABELS } from "../utils/labels";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "username",
  "password",
  "full_name",
  "phone",
  "dob",
  "gender",
  "grade_level",
  "parent_name",
  "parent_phone",
  "address",
  "note",
  "status",
] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/academic/students";

const GENDER_CHOICES = [
  { value: 0, label: GENDER_LABELS[0] },
  { value: 1, label: GENDER_LABELS[1] },
  { value: 2, label: GENDER_LABELS[2] },
];

const STATUS_CHOICES = [
  { value: 0, label: STUDENT_STATUS_LABELS[0] },
  { value: 1, label: STUDENT_STATUS_LABELS[1] },
  { value: 2, label: STUDENT_STATUS_LABELS[2] },
];

const GRADE_CHOICES = GRADE_LEVELS.map((grade) => ({
  value: grade,
  label: GRADE_LEVEL_LABELS[grade],
}));

/**
 * Coordinates creating and editing a student.
 *
 * Creating also creates the login account, so the credentials appear here and
 * nowhere else, matching how a teacher profile behaves.
 */
export function StudentFormContainer({ student }: { student?: Student }) {
  const router = useRouter();
  const isEditing = student !== undefined;
  const create = useCreateStudent();
  const update = useUpdateStudent(student?.id ?? 0);

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    StudentFormInput,
    StudentFormValues
  >({
    // Both modes share one field shape; only creating demands the credentials.
    resolver: zodResolver(isEditing ? studentEditSchema : studentCreateSchema),
    defaultValues: {
      username: student?.username ?? "",
      password: "",
      full_name: student?.full_name ?? "",
      phone: student?.phone ?? "",
      dob: student?.dob ?? "",
      gender: student?.gender ?? 0,
      grade_level: student?.grade_level ?? 0,
      parent_name: student?.parent_name ?? "",
      parent_phone: student?.parent_phone ?? "",
      address: student?.address ?? "",
      note: student?.note ?? "",
      status: student?.status ?? 0,
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const profile = {
        full_name: values.full_name,
        phone: emptyToNull(values.phone),
        dob: emptyToNull(values.dob),
        gender: values.gender,
        grade_level: values.grade_level,
        parent_name: values.parent_name,
        parent_phone: emptyToNull(values.parent_phone),
        address: emptyToNull(values.address),
        note: emptyToNull(values.note),
        status: values.status,
      };

      if (isEditing) {
        return update.mutateAsync(profile);
      }

      // The create resolver already required both; the fallbacks only satisfy the
      // shared form type, whose credentials are optional for the edit mode.
      return create.mutateAsync({
        ...profile,
        username: values.username ?? "",
        password: values.password ?? "",
      });
    },
    onSuccess: () => {
      router.push(LIST_HREF);
      router.refresh();
    },
  });

  const errors = form.formState.errors;

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        title={isEditing ? "Sửa hồ sơ học sinh" : "Thêm học sinh"}
        description={
          isEditing
            ? "Tên đăng nhập không đổi được. Đổi mật khẩu ở danh sách học sinh."
            : "Tạo hồ sơ học sinh và tài khoản đăng nhập đi kèm."
        }
      />

      <FormShell
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Lưu thay đổi" : "Tạo học sinh"}
        cancelHref={LIST_HREF}
      >
        <Field name="full_name" label="Họ và tên" required error={errors.full_name?.message}>
          <Input
            {...form.register("full_name")}
            {...fieldAria("full_name", errors.full_name?.message)}
            autoComplete="off"
          />
        </Field>

        <Field
          name="phone"
          label="Số điện thoại"
          hint="Không bắt buộc."
          error={errors.phone?.message}
        >
          <Input
            {...form.register("phone")}
            {...fieldAria("phone", errors.phone?.message, "Không bắt buộc.")}
            type="tel"
            inputMode="tel"
          />
        </Field>

        <Controller
          control={form.control}
          name="dob"
          render={({ field }) => (
            <DateField
              name="dob"
              label="Ngày sinh"
              hint="Không bắt buộc."
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.dob?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="gender"
          render={({ field }) => (
            <SelectField
              name="gender"
              label="Giới tính"
              required
              value={field.value}
              choices={GENDER_CHOICES}
              onChange={field.onChange}
              error={errors.gender?.message}
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

        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <SelectField
              name="status"
              label="Trạng thái học tập"
              required
              value={field.value}
              choices={STATUS_CHOICES}
              onChange={field.onChange}
              error={errors.status?.message}
              hint="Khác với trạng thái tài khoản đăng nhập."
            />
          )}
        />

        <Field
          name="parent_name"
          label="Tên phụ huynh"
          required
          error={errors.parent_name?.message}
        >
          <Input
            {...form.register("parent_name")}
            {...fieldAria("parent_name", errors.parent_name?.message)}
            autoComplete="off"
          />
        </Field>

        <Field
          name="parent_phone"
          label="Số điện thoại phụ huynh"
          hint="Không bắt buộc."
          error={errors.parent_phone?.message}
        >
          <Input
            {...form.register("parent_phone")}
            {...fieldAria("parent_phone", errors.parent_phone?.message, "Không bắt buộc.")}
            type="tel"
            inputMode="tel"
          />
        </Field>

        <Field
          name="address"
          label="Địa chỉ"
          hint="Không bắt buộc."
          error={errors.address?.message}
          className="sm:col-span-2"
        >
          <Textarea
            {...form.register("address")}
            {...fieldAria("address", errors.address?.message, "Không bắt buộc.")}
            rows={2}
          />
        </Field>

        <Field
          name="note"
          label="Ghi chú"
          hint="Không bắt buộc."
          error={errors.note?.message}
          className="sm:col-span-2"
        >
          <Textarea
            {...form.register("note")}
            {...fieldAria("note", errors.note?.message, "Không bắt buộc.")}
            rows={2}
          />
        </Field>

        {isEditing ? null : (
          <>
            <Field
              name="username"
              label="Tên đăng nhập"
              required
              hint="Không đổi được sau khi tạo."
              error={errors.username?.message}
            >
              <Input
                {...form.register("username")}
                {...fieldAria("username", errors.username?.message, "Không đổi được sau khi tạo.")}
                autoComplete="off"
              />
            </Field>

            <Field name="password" label="Mật khẩu" required error={errors.password?.message}>
              <Input
                {...form.register("password")}
                {...fieldAria("password", errors.password?.message)}
                type="password"
                autoComplete="new-password"
              />
            </Field>
          </>
        )}
      </FormShell>
    </div>
  );
}
