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
import { useCreateTeacher, useUpdateTeacher } from "../hooks/use-teachers";
import {
  emptyToNull,
  teacherCreateSchema,
  teacherEditSchema,
  type TeacherFormInput,
  type TeacherFormValues,
} from "../schemas/academic-form-schema";
import type { Teacher } from "../types/academic";
import { EMPLOYEE_STATUS_LABELS } from "../utils/labels";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "username",
  "password",
  "full_name",
  "phone",
  "email",
  "address",
  "status",
  "color",
  "joined_at",
  "bank_bin",
  "bank_name",
  "bank_account_number",
  "bank_account_holder",
] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/academic/teachers";

/** The two employment states, as choices for the select. */
const STATUS_CHOICES = [
  { value: 0, label: EMPLOYEE_STATUS_LABELS[0] },
  { value: 1, label: EMPLOYEE_STATUS_LABELS[1] },
];

/**
 * Coordinates creating and editing a teacher.
 *
 * Creating also creates the login account, so the credentials appear here and
 * nowhere else. Editing hides them: the login name never changes, and the password
 * has its own dialog on the list screen.
 */
export function TeacherFormContainer({ teacher }: { teacher?: Teacher }) {
  const router = useRouter();
  const isEditing = teacher !== undefined;
  const create = useCreateTeacher();
  const update = useUpdateTeacher(teacher?.id ?? 0);

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    TeacherFormInput,
    TeacherFormValues
  >({
    // Both modes share one field shape; only creating demands the credentials, so
    // only creating gets the stricter resolver.
    resolver: zodResolver(isEditing ? teacherEditSchema : teacherCreateSchema),
    defaultValues: {
      username: teacher?.username ?? "",
      password: "",
      full_name: teacher?.full_name ?? "",
      phone: teacher?.phone ?? "",
      email: teacher?.email ?? "",
      address: teacher?.address ?? "",
      status: teacher?.status ?? 0,
      color: teacher?.color ?? "",
      joined_at: teacher?.joined_at ?? "",
      bank_bin: teacher?.bank_bin ?? "",
      bank_name: teacher?.bank_name ?? "",
      bank_account_number: teacher?.bank_account_number ?? "",
      bank_account_holder: teacher?.bank_account_holder ?? "",
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const profile = {
        full_name: values.full_name,
        phone: values.phone,
        email: values.email,
        address: emptyToNull(values.address),
        status: values.status,
        color: emptyToNull(values.color),
        joined_at: values.joined_at,
        bank_bin: emptyToNull(values.bank_bin),
        bank_name: emptyToNull(values.bank_name),
        bank_account_number: emptyToNull(values.bank_account_number),
        bank_account_holder: emptyToNull(values.bank_account_holder),
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
        title={isEditing ? "Sửa hồ sơ giáo viên" : "Thêm giáo viên"}
        description={
          isEditing
            ? "Tên đăng nhập không đổi được. Đổi mật khẩu ở danh sách giáo viên."
            : "Tạo hồ sơ giáo viên và tài khoản đăng nhập đi kèm."
        }
      />

      <FormShell
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Lưu thay đổi" : "Tạo giáo viên"}
        cancelHref={LIST_HREF}
      >
        <Field name="full_name" label="Họ và tên" required error={errors.full_name?.message}>
          <Input
            {...form.register("full_name")}
            {...fieldAria("full_name", errors.full_name?.message)}
            autoComplete="off"
          />
        </Field>

        <Field name="phone" label="Số điện thoại" required error={errors.phone?.message}>
          <Input
            {...form.register("phone")}
            {...fieldAria("phone", errors.phone?.message)}
            type="tel"
            inputMode="tel"
            placeholder="0901234567"
          />
        </Field>

        <Field name="email" label="Email" required error={errors.email?.message}>
          <Input
            {...form.register("email")}
            {...fieldAria("email", errors.email?.message)}
            type="email"
            autoComplete="off"
          />
        </Field>

        <Controller
          control={form.control}
          name="joined_at"
          render={({ field }) => (
            <DateField
              name="joined_at"
              label="Ngày vào làm"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.joined_at?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <SelectField
              name="status"
              label="Trạng thái làm việc"
              required
              value={field.value}
              choices={STATUS_CHOICES}
              onChange={field.onChange}
              error={errors.status?.message}
              hint="Giáo viên đã nghỉ không chọn được khi mở lớp."
            />
          )}
        />

        <Field
          name="color"
          label="Màu đại diện"
          hint="Không bắt buộc. Dùng cho lịch học sau này."
          error={errors.color?.message}
        >
          <Input
            {...form.register("color")}
            {...fieldAria("color", errors.color?.message, "Không bắt buộc.")}
            placeholder="#FD7110"
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
