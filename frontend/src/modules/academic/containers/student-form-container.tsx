"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard, KeyRound, UserRound, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { useState, type ReactNode } from "react";

import { BackLink } from "@/components/shared/back-link";
import { DateField } from "@/components/shared/date-field";
import { Field, fieldAria } from "@/components/shared/field";
import { FormShell } from "@/components/shared/form-shell";
import { SelectField } from "@/components/shared/select-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResourceForm } from "@/hooks/use-resource-form";
import { cn } from "@/lib/utils/index";
import { AvatarDraftField, ProfileAvatarEditorContainer, type AvatarDraft } from "@/modules/avatar";

import { useCreateStudent, useUpdateStudent } from "../hooks/use-students";
import {
  emptyToNull,
  studentCreateSchema,
  studentEditSchema,
  type StudentFormInput,
  type StudentFormValues,
} from "../schemas/academic-form-schema";
import type { Student } from "../types/academic";
import {
  GENDER_LABELS,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  STUDENT_STATUS_LABELS,
} from "../utils/labels";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "username",
  "password",
  "full_name",
  "phone",
  "dob",
  "gender",
  "grade_level",
  "guardian_name",
  "guardian_gender",
  "guardian_relationship",
  "guardian_phone",
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

const GUARDIAN_RELATIONSHIP_CHOICES = [
  { value: 0, label: GUARDIAN_RELATIONSHIP_LABELS[0] },
  { value: 1, label: GUARDIAN_RELATIONSHIP_LABELS[1] },
  { value: 2, label: GUARDIAN_RELATIONSHIP_LABELS[2] },
];

/** The accent each section of the form is tagged with, reusing the app's own palette. */
const SECTION_ACCENT = {
  student: "bg-vc-orange/12 text-vc-orange-deep",
  guardian: "bg-vc-wood/12 text-vc-wood",
  account: "bg-vc-leaf/12 text-vc-leaf",
} as const;

/**
 * Groups a few related fields under a heading and a one-line reason they belong
 * together, so a fifteen-field form reads as three short ones instead of a wall.
 */
function FormSection({
  icon: Icon,
  accent,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  accent: keyof typeof SECTION_ACCENT;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-vc-surface-raised">
      <div className="flex items-start gap-3 border-b bg-card/60 px-5 py-4">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            SECTION_ACCENT[accent],
          )}
        >
          <Icon aria-hidden="true" className="size-4.5" />
        </div>
        <div className="grid gap-0.5 pt-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

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
  // Only creating carries the avatar with the profile; editing saves it on its own.
  const [avatar, setAvatar] = useState<AvatarDraft>({ type: "none" });

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
      guardian_name: student?.guardian_name ?? "",
      guardian_gender: student?.guardian_gender ?? 0,
      guardian_relationship: student?.guardian_relationship ?? 0,
      guardian_phone: student?.guardian_phone ?? "",
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
        guardian_name: values.guardian_name,
        guardian_gender: values.guardian_gender,
        guardian_relationship: values.guardian_relationship,
        guardian_phone: emptyToNull(values.guardian_phone),
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
        payload: {
          ...profile,
          username: values.username ?? "",
          password: values.password ?? "",
          avatar: avatar.type === "file" ? { type: "file" } : avatar,
        },
        avatar_file: avatar.type === "file" ? avatar.file : undefined,
      });
    },
    onSuccess: () => {
      router.push(LIST_HREF);
      router.refresh();
    },
    successMessage: isEditing
      ? "Đã lưu thay đổi hồ sơ học sinh."
      : "Đã tạo học sinh và tài khoản đăng nhập.",
  });

  const errors = form.formState.errors;

  return (
    <div className="grid max-w-6xl gap-6">
      <BackLink href={LIST_HREF} label="Danh sách học sinh" />

      <FormShell
        bare
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Lưu thay đổi" : "Tạo học sinh"}
        cancelHref={LIST_HREF}
      >
        {/* Two sections up on a wide screen, each sized to its own content
            rather than stretched to match its taller neighbor; the shorter
            account section, when it renders, trails alone below both. */}
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <FormSection
            icon={IdCard}
            accent="student"
            title="Học sinh"
            description="Thông tin để nhận diện và liên hệ với học sinh."
          >
            <Field
              name="full_name"
              label="Họ và tên"
              required
              error={errors.full_name?.message}
            >
              <Input
                {...form.register("full_name")}
                {...fieldAria("full_name", errors.full_name?.message)}
                autoComplete="off"
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
              name="phone"
              label="Số điện thoại"
              hint="Không bắt buộc."
              error={errors.phone?.message}
            >
              <Input
                {...form.register("phone")}
                {...fieldAria(
                  "phone",
                  errors.phone?.message,
                  "Không bắt buộc.",
                )}
                type="tel"
                inputMode="tel"
              />
            </Field>
          </FormSection>

          <FormSection
            icon={UserRound}
            accent="guardian"
            title="Phụ huynh"
            description="Người phụ trách học sinh và cách liên hệ khi cần trao đổi."
          >
            <Field
              name="guardian_name"
              label="Tên phụ huynh"
              required
              error={errors.guardian_name?.message}
            >
              <Input
                {...form.register("guardian_name")}
                {...fieldAria("guardian_name", errors.guardian_name?.message)}
                autoComplete="off"
              />
            </Field>

            <Controller
              control={form.control}
              name="guardian_gender"
              render={({ field }) => (
                <SelectField
                  name="guardian_gender"
                  label="Giới tính phụ huynh"
                  required
                  value={field.value}
                  choices={GENDER_CHOICES}
                  onChange={field.onChange}
                  error={errors.guardian_gender?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="guardian_relationship"
              render={({ field }) => (
                <SelectField
                  name="guardian_relationship"
                  label="Quan hệ với học sinh"
                  required
                  value={field.value}
                  choices={GUARDIAN_RELATIONSHIP_CHOICES}
                  onChange={field.onChange}
                  error={errors.guardian_relationship?.message}
                />
              )}
            />

            <Field
              name="guardian_phone"
              label="Số điện thoại phụ huynh"
              hint="Không bắt buộc."
              error={errors.guardian_phone?.message}
            >
              <Input
                {...form.register("guardian_phone")}
                {...fieldAria(
                  "guardian_phone",
                  errors.guardian_phone?.message,
                  "Không bắt buộc.",
                )}
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
                {...fieldAria(
                  "address",
                  errors.address?.message,
                  "Không bắt buộc.",
                )}
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
          </FormSection>

          {isEditing ? null : (
            <AvatarDraftField value={avatar} onChange={setAvatar} disabled={isSubmitting} />
          )}

          {isEditing ? null : (
            <FormSection
              icon={KeyRound}
              accent="account"
              title="Tài khoản đăng nhập"
              description="Học sinh dùng thông tin này để vào cổng thông tin."
            >
              <Field
                name="username"
                label="Tên đăng nhập"
                required
                hint="Không đổi được sau khi tạo."
                error={errors.username?.message}
              >
                <Input
                  {...form.register("username")}
                  {...fieldAria(
                    "username",
                    errors.username?.message,
                    "Không đổi được sau khi tạo.",
                  )}
                  autoComplete="off"
                />
              </Field>

              <Field
                name="password"
                label="Mật khẩu"
                required
                error={errors.password?.message}
              >
                <Input
                  {...form.register("password")}
                  {...fieldAria("password", errors.password?.message)}
                  type="password"
                  autoComplete="new-password"
                />
              </Field>
            </FormSection>
          )}
        </div>
      </FormShell>

      {/* Editing saves the avatar through its own endpoint, so it sits outside the
          profile form rather than inside a form it must never submit. */}
      {isEditing ? (
        <ProfileAvatarEditorContainer
          profileId={student.profile_id}
          ownerUserId={student.user_id}
          initialAvatar={student.avatar}
        />
      ) : null}
    </div>
  );
}
