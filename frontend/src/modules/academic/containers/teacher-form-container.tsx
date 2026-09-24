"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { useState } from "react";

import { BackLink } from "@/components/shared/back-link";
import { DateField } from "@/components/shared/date-field";
import { Field, fieldAria } from "@/components/shared/field";
import { FormSheet } from "@/components/shared/form-sheet";
import { SelectField } from "@/components/shared/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResourceForm } from "@/hooks/use-resource-form";
import { cn, foldVietnamese } from "@/lib/utils/index";

import { AvatarDraftField } from "../components/avatar-draft-field";
import { NumberedSection } from "../components/numbered-section";
import { SHEET_FIELD_GRID, SHEET_FIELD_TYPE } from "../components/form-control";
import type { AvatarDraft } from "../types/avatar";
import { useSaveProfileAvatar } from "../hooks/use-save-profile-avatar";
import { useCreateTeacher, useUpdateTeacher } from "../hooks/use-teachers";
import {
  emptyToNull,
  teacherCreateSchema,
  teacherEditSchema,
  type TeacherFormInput,
  type TeacherFormValues,
} from "../schemas/academic-form-schema";
import type { Teacher } from "../types/academic";
import { GENDER_LABELS, TEACHER_STATUS_LABELS } from "../utils/labels";
import { teacherOffboardingAssignments } from "../utils/teacher-offboarding";
import { randomAdventurer } from "../utils/adventurer";
import { TeacherAccountSection } from "./teacher-account-section";
import { TeacherOffboardingDialog } from "./teacher-offboarding-dialog";
import "../styles/student-form.css";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "username",
  "password",
  "full_name",
  "phone",
  "email",
  "gender",
  "address",
  "status",
  "joined_at",
] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/academic/teachers";

/** The two employment states, as choices for the select. */
const STATUS_CHOICES = [
  { value: 0, label: TEACHER_STATUS_LABELS[0] },
  { value: 1, label: TEACHER_STATUS_LABELS[1] },
];

/** The recorded genders, as choices for the select. */
const GENDER_CHOICES = [
  { value: 0, label: GENDER_LABELS[0] },
  { value: 1, label: GENDER_LABELS[1] },
  { value: 2, label: GENDER_LABELS[2] },
];

/** Coordinates creating and editing a teacher in the shared mock-inspired sheet. */
export function TeacherFormContainer({ teacher }: { teacher?: Teacher }) {
  const router = useRouter();
  const isEditing = teacher !== undefined;
  const create = useCreateTeacher();
  const update = useUpdateTeacher(teacher?.id ?? 0);
  const saveAvatar = useSaveProfileAvatar();
  const [avatar, setAvatar] = useState<AvatarDraft>(() =>
    teacher === undefined
      ? randomAdventurer("male")
      : teacher.avatar?.type === "dicebear"
        ? teacher.avatar
        : { type: "none" },
  );
  const [avatarTouched, setAvatarTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [retirementOpen, setRetirementOpen] = useState(false);
  const [retirementConfirmed, setRetirementConfirmed] = useState(false);
  const [replacementTeacherIds, setReplacementTeacherIds] = useState<Record<number, number>>({});
  const [replacementTeacherLabels, setReplacementTeacherLabels] = useState<Record<number, string>>({});

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    TeacherFormInput,
    TeacherFormValues
  >({
    resolver: zodResolver(isEditing ? teacherEditSchema : teacherCreateSchema),
    defaultValues: {
      username: teacher?.username ?? "",
      password: "",
      full_name: teacher?.full_name ?? "",
      phone: teacher?.phone ?? "",
      email: teacher?.email ?? "",
      gender: teacher?.gender ?? 0,
      address: teacher?.address ?? "",
      status: teacher?.status ?? 0,
      joined_at: teacher?.joined_at ?? "",
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const profile = {
        full_name: values.full_name,
        phone: values.phone,
        email: emptyToNull(values.email),
        gender: values.gender,
        address: emptyToNull(values.address),
        status: values.status,
        joined_at: values.joined_at,
      };

      if (isEditing) {
        const saved = await update.mutateAsync({
          ...profile,
          ...(retirementConfirmed ? { replacement_teacher_ids: replacementTeacherIds } : {}),
        });

        if (avatarTouched && avatar.type !== "none") {
          await saveAvatar.save({
            profileId: teacher.profile_id,
            ownerUserId: teacher.user_id,
            draft: avatar,
          });
        }

        return saved;
      }

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
      ? "Đã lưu thay đổi hồ sơ giáo viên."
      : "Đã tạo giáo viên và tài khoản đăng nhập.",
  });

  const errors = form.formState.errors;

  /** Records an avatar choice so an edit saves it only when the reader changed it. */
  function chooseAvatar(next: AvatarDraft): void {
    setAvatar(next);
    setAvatarTouched(true);
  }

  /** Fills a teacher login name from the teacher's Vietnamese full name. */
  function generateUsername(): void {
    const compact = foldVietnamese(form.getValues("full_name") ?? "").replace(/[^a-z0-9]+/g, "");

    if (compact === "") {
      form.setError("full_name", { message: "Nhập họ và tên trước khi tự tạo tên đăng nhập." });
      form.setFocus("full_name");
      return;
    }

    form.setValue("username", `gv_${compact}`, { shouldValidate: true });
    form.clearErrors("username");
    form.setFocus("username");
  }

  const profileSection = (
    <NumberedSection
      index={3}
      title="Thông tin giáo viên"
      description="Thông tin liên hệ và trạng thái làm việc hiện tại."
    >
      <div className={cn(SHEET_FIELD_GRID, SHEET_FIELD_TYPE)}>
        <Field name="full_name" label="Họ và tên" required error={errors.full_name?.message}>
          <Input
            {...form.register("full_name")}
            {...fieldAria("full_name", errors.full_name?.message)}
            placeholder="Nhập họ và tên giáo viên"
            autoComplete="off"
            size="control"
          />
        </Field>

        <Field
          name="phone"
          label="Số điện thoại"
          required
          hint="Dùng số điện thoại Việt Nam."
          error={errors.phone?.message}
        >
          <Input
            {...form.register("phone")}
            {...fieldAria("phone", errors.phone?.message, "Dùng số điện thoại Việt Nam.")}
            type="tel"
            inputMode="tel"
            placeholder="Ví dụ: 0901 234 567"
            size="control"
          />
        </Field>

        <Field
          name="email"
          label="Email"
          hint="Không bắt buộc."
          error={errors.email?.message}
        >
          <Input
            {...form.register("email")}
            {...fieldAria("email", errors.email?.message, "Không bắt buộc.")}
            type="email"
            autoComplete="off"
            placeholder="ten@truong.edu.vn"
            size="control"
          />
        </Field>

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
              size="control"
            />
          )}
        />

        <Controller
          control={form.control}
          name="joined_at"
          render={({ field }) => (
            <DateField
              name="joined_at"
              label="Ngày vào làm"
              required
              hint="Không được sau ngày hiện tại."
              value={field.value}
              onChange={field.onChange}
              error={errors.joined_at?.message}
              size="control"
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
              onChange={(value) => {
                if (isEditing && teacher.status === 0 && value === 1) {
                  setReplacementTeacherIds({});
                  setReplacementTeacherLabels({});
                  setRetirementConfirmed(false);
                  setRetirementOpen(true);
                  return;
                }

                if (value === 0) {
                  setReplacementTeacherIds({});
                  setReplacementTeacherLabels({});
                  setRetirementConfirmed(false);
                }
                field.onChange(value);
              }}
              error={errors.status?.message}
              hint={isEditing && teacher.status === 1 && field.value === 0
                ? "Mở lại trạng thái công tác không tự khôi phục các phân công đã gỡ; hãy phân công lại trong biểu mẫu sửa lớp."
                : "Tách khỏi khóa tài khoản. Chuyển sang Đã nghỉ yêu cầu xác nhận phân công lớp."}
              size="control"
            />
          )}
        />

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
            placeholder="Nhập địa chỉ hiện tại"
            size="control"
          />
        </Field>
      </div>
    </NumberedSection>
  );

  const avatarSection = (
    <NumberedSection
      index={1}
      title="Ảnh đại diện"
      description="Giúp nhà trường nhận diện giáo viên nhanh hơn."
    >
      <AvatarDraftField
        bare
        value={avatar}
        current={teacher?.avatar ?? null}
        name={teacher?.full_name ?? "Giáo viên mới"}
        allowUpload={!isEditing || (typeof teacher?.user_id === "number" && teacher.user_id > 0)}
        onChange={chooseAvatar}
        disabled={isSubmitting}
      />
    </NumberedSection>
  );

  const accountSection = (
    <NumberedSection
      index={2}
      title="Tài khoản đăng nhập"
      description={
        isEditing
          ? "Tên đăng nhập, trạng thái và bảo mật tài khoản."
          : "Thông tin giáo viên dùng trong lần đăng nhập đầu tiên."
      }
    >
      {isEditing ? (
        <TeacherAccountSection teacher={teacher} />
      ) : (
        <div className={cn(SHEET_FIELD_GRID, SHEET_FIELD_TYPE)}>
          <Field
            name="username"
            label="Tên đăng nhập"
            required
            hint="Chữ thường không dấu, số và dấu gạch dưới."
            error={errors.username?.message}
          >
            <div className="flex">
              <Input
                {...form.register("username")}
                {...fieldAria(
                  "username",
                  errors.username?.message,
                  "Chữ thường không dấu, số và dấu gạch dưới.",
                )}
                placeholder="Ví dụ: gv_nguyenthimai"
                autoComplete="username"
                size="control"
                className="rounded-r-none border-r-0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isSubmitting}
                title="Tự tạo tên đăng nhập từ họ và tên"
                aria-label="Tự tạo tên đăng nhập từ họ và tên"
                className="size-11 shrink-0 rounded-control rounded-l-none border-vc-control bg-background"
                onClick={generateUsername}
              >
                <RefreshCw aria-hidden="true" className="size-[17px]" />
              </Button>
            </div>
          </Field>

          <Field name="password" label="Mật khẩu" required error={errors.password?.message}>
            <div className="relative">
              <Input
                {...form.register("password")}
                {...fieldAria("password", errors.password?.message)}
                id="teacher-password"
                type={showPassword ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                size="control"
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute top-1/2 right-1 size-10 -translate-y-1/2 rounded-[4px] text-muted-foreground"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-[17px]" />
                ) : (
                  <Eye aria-hidden="true" className="size-[17px]" />
                )}
              </Button>
            </div>
          </Field>
        </div>
      )}
    </NumberedSection>
  );

  return (
    <div className="grid max-w-6xl gap-6">
      <div className="grid gap-[18px]">
        <BackLink href={LIST_HREF} label="Danh sách giáo viên" />
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {isEditing ? "Hồ sơ giáo viên" : "Hồ sơ mới"}
            </span>
            {isEditing ? (
              <span className="inline-flex min-h-[26px] items-center gap-1.5 rounded-control border border-vc-control bg-card px-2 py-1 font-mono text-[10px] font-medium tracking-[0.04em]">
                <span className="text-muted-foreground">Mã hồ sơ</span>#{teacher.id}
              </span>
            ) : null}
          </div>
          <h2 className="text-[28px] leading-[1.3] font-semibold tracking-[-0.02em] md:text-[34px]">
            {isEditing ? "Sửa giáo viên" : "Tạo giáo viên"}
          </h2>
          <p className="mt-[7px] text-xs text-muted-foreground">
            {isEditing
              ? `Cập nhật hồ sơ và quyền đăng nhập của ${teacher.full_name}.`
              : "Tạo hồ sơ liên hệ và tài khoản đăng nhập cho giáo viên mới."}
          </p>
        </div>
      </div>

      <FormSheet
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        actions={
          <>
            <Button type="button" variant="ghost" asChild disabled={isSubmitting}>
              <Link href={LIST_HREF} className="min-w-[104px] justify-center">
                Hủy
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 min-w-[155px] gap-2 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px]"
            >
              <Check aria-hidden="true" className="size-[19px]" />
              {isSubmitting ? "Đang lưu…" : isEditing ? "Lưu thay đổi" : "Tạo giáo viên"}
            </Button>
          </>
        }
      >
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <aside className="vc-form-grid-paper rounded-t-sheet border-b border-vc-rule p-7 max-md:px-4 max-md:py-5 lg:rounded-tr-none lg:rounded-bl-sheet lg:border-r lg:border-b-0">
            {avatarSection}
            {accountSection}
          </aside>

          <div className="p-7 lg:px-8">{profileSection}</div>
        </div>

        {isEditing && retirementConfirmed ? (
          <aside className="grid gap-2 border-t border-vc-rule bg-vc-tint p-4" aria-live="polite">
            <strong className="text-sm">Kế hoạch phân công sẽ áp dụng khi lưu hồ sơ.</strong>
            {Object.entries(replacementTeacherIds).length === 0 ? (
              <p className="text-xs text-muted-foreground">Không có lớp phụ trách cần thay người.</p>
            ) : (
              <ul className="grid gap-1 text-xs">
                {Object.entries(replacementTeacherIds).map(([classId, teacherId]) => {
                  const schoolClass = teacher.classes.find((item) => item.id === Number(classId));
                  return (
                    <li key={classId}>
                      <span className="font-mono">{schoolClass?.code ?? `Lớp #${classId}`}</span>
                      {schoolClass === undefined ? "" : ` · ${schoolClass.name}`} → {replacementTeacherLabels[Number(classId)] ?? `Giáo viên #${teacherId}`}
                    </li>
                  );
                })}
              </ul>
            )}
            {teacherOffboardingAssignments(teacher).assistantClassIds.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Gỡ {teacherOffboardingAssignments(teacher).assistantClassIds.length} vai trò trợ giảng đang hoạt động.
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">Tài khoản đăng nhập không bị khóa theo thay đổi trạng thái công tác.</p>
          </aside>
        ) : null}
      </FormSheet>

      {isEditing ? (
        <TeacherOffboardingDialog
          open={retirementOpen}
          teacher={teacher}
          replacements={replacementTeacherIds}
          onReplacementsChange={setReplacementTeacherIds}
          onReplacementLabelChange={(classId, label) => setReplacementTeacherLabels((current) => ({
            ...current,
            [classId]: label,
          }))}
          onOpenChange={(open) => {
            setRetirementOpen(open);
            if (!open) {
              setReplacementTeacherIds({});
              setReplacementTeacherLabels({});
              setRetirementConfirmed(false);
            }
          }}
          onConfirm={() => {
            setRetirementConfirmed(true);
            form.setValue("status", 1, { shouldDirty: true, shouldValidate: true });
            setRetirementOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
