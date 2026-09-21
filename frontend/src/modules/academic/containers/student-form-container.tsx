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
import { cn } from "@/lib/utils/index";
import { AvatarDraftField } from "../components/avatar-draft-field";
import { useSaveProfileAvatar } from "../hooks/use-save-profile-avatar";
import type { AvatarDraft } from "../types/avatar";
import { randomAdventurer } from "../utils/adventurer";

import { NumberedSection } from "../components/numbered-section";
import { SHEET_FIELD_GRID, SHEET_FIELD_TYPE } from "../components/form-control";
import { GuardianRosterField } from "../components/guardian-roster-field";
import { StudentAccountSection } from "./student-account-section";
import { useCreateStudent, useUpdateStudent } from "../hooks/use-students";
import {
  emptyToNull,
  studentCreateSchema,
  studentEditSchema,
  type GuardianDraft,
  type StudentFormInput,
  type StudentFormValues,
} from "../schemas/academic-form-schema";
import "../styles/student-form.css";
import type { Student } from "../types/academic";
import type { StudentGuardianEntry } from "../types/academic-requests";
import {
  GENDER_LABELS,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  STUDENT_STATUS_LABELS,
} from "../utils/labels";
import { suggestStudentUsername } from "../utils/student-username";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "username",
  "password",
  "full_name",
  "phone",
  "dob",
  "gender",
  "grade_level",
  "guardians",
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
 * Turns the roster the form is holding into the entries the API reads.
 *
 * Each row becomes one of the two shapes the endpoint accepts, chosen by whether the
 * person already has a profile: an identifier links them, a name and gender create
 * them. Keys from the other shape are omitted rather than sent as null, because the
 * API tells the shapes apart by which keys are present and refuses a payload carrying
 * both.
 */
function guardianPayload(drafts: GuardianDraft[]): StudentGuardianEntry[] {
  return drafts.map((draft) =>
    draft.profile_id === null
      ? {
          name: draft.name,
          gender: draft.gender,
          phone: emptyToNull(draft.phone),
          relationship: draft.relationship,
          is_primary: draft.is_primary,
        }
      : {
          guardian_profile_id: draft.profile_id,
          relationship: draft.relationship,
          is_primary: draft.is_primary,
        },
  );
}

/**
 * Reads the roster a student already has into the rows the form edits.
 *
 * Everybody on file is carried by their `profile_id`, so saving an untouched roster
 * re-links exactly the same people rather than creating second copies of them.
 */
function guardianDrafts(student: Student | undefined): GuardianDraft[] {
  return (student?.guardians ?? []).map((guardian) => ({
    key: `linked-${guardian.profile_id}`,
    profile_id: guardian.profile_id,
    name: guardian.full_name,
    phone: guardian.phone ?? "",
    gender: 0 as const,
    relationship: guardian.relationship,
    is_primary: guardian.is_primary,
    is_saved: true,
  }));
}

/**
 * Coordinates creating and editing a student.
 *
 * Both modes render the same sheet, in the same four blocks and the same two
 * columns: the avatar and the login account on the left, the profile and the
 * guardian on the right. A reader who has created a student is then looking at the
 * screen they already know when they come back to correct it.
 *
 * What the two halves of the left column mean does change. Creating carries the
 * avatar inside its own multipart request and sets the credentials the account is
 * born with. Editing has neither: the avatar is written through the profile avatar
 * endpoint once the sheet is saved, the login name cannot be changed at all, and
 * locking the account or replacing the password are separate endpoints that act on
 * confirmation — which is why `StudentAccountSection` states that plainly rather
 * than dressing them as fields of this form.
 */
export function StudentFormContainer({ student }: { student?: Student }) {
  const router = useRouter();
  const isEditing = student !== undefined;
  const create = useCreateStudent();
  const update = useUpdateStudent(student?.id ?? 0);
  const saveAvatar = useSaveProfileAvatar();
  // A new profile starts on a sample avatar rather than on initials, so the face in
  // the list is a face — the reader re-rolls or uploads over it. An existing profile
  // starts on the face it already has, which only a generated one can be reopened
  // into: a stored photo is an id, so the draft stays empty and the field is handed
  // the stored value to rest on instead.
  const [avatar, setAvatar] = useState<AvatarDraft>(() =>
    student === undefined
      ? randomAdventurer("male")
      : student.avatar?.type === "dicebear"
        ? student.avatar
        : { type: "none" },
  );
  // Whether the reader has actually picked something. Editing writes the avatar
  // through its own endpoint, and an untouched draft is the stored avatar restated —
  // saving it would re-upload a photo, or replace one with the empty draft standing
  // in for it.
  const [avatarTouched, setAvatarTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /** Records a chosen avatar and that the reader chose it. */
  function chooseAvatar(next: AvatarDraft): void {
    setAvatar(next);
    setAvatarTouched(true);
  }

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
      guardians: guardianDrafts(student),
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
        address: emptyToNull(values.address),
        note: emptyToNull(values.note),
        status: values.status,
        guardians: guardianPayload(values.guardians),
      };

      if (isEditing) {
        const saved = await update.mutateAsync(profile);

        // After the profile, so a refused field leaves the avatar alone rather than
        // writing half the sheet before reporting the other half was rejected. An
        // empty draft is never written: this screen offers no way to remove a
        // picture, so the only thing it could mean is an upload tab nobody dropped a
        // file into — and that must not quietly erase the photo on file.
        if (avatarTouched && avatar.type !== "none") {
          await saveAvatar.save({
            profileId: student.profile_id,
            ownerUserId: student.user_id,
            draft: avatar,
          });
        }

        return saved;
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
      const destination = isEditing ? `/academic/students/${student.id}` : LIST_HREF;
      router.push(destination);
      router.refresh();
    },
    successMessage: isEditing
      ? "Đã lưu thay đổi hồ sơ học sinh."
      : "Đã tạo học sinh và tài khoản đăng nhập.",
  });

  const errors = form.formState.errors;

  /** Fills the login name from the student's own name, asking for the name first. */
  function generateUsername(): void {
    const suggested = suggestStudentUsername(form.getValues("full_name") ?? "");

    if (suggested === "") {
      form.setError("full_name", { message: "Nhập họ và tên trước khi tự tạo tên đăng nhập." });
      form.setFocus("full_name");
      return;
    }

    form.setValue("username", suggested);
    form.clearErrors("username");
    form.setFocus("username");
  }

  const profileSection = (
    <NumberedSection
      index={3}
      title="Thông tin học sinh"
      description="Thông tin cơ bản trong hồ sơ học vụ."
    >
      <div className={cn(SHEET_FIELD_GRID, SHEET_FIELD_TYPE)}>
        <Field name="full_name" label="Họ và tên" required error={errors.full_name?.message}>
          <Input
            {...form.register("full_name")}
            {...fieldAria("full_name", errors.full_name?.message)}
            placeholder="Nhập họ và tên học sinh"
            autoComplete="off"
            size="control"
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
              size="control"
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
              size="control"
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
              size="control"
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
            {...fieldAria("phone", errors.phone?.message, "Không bắt buộc.")}
            type="tel"
            inputMode="tel"
            placeholder="Nhập số điện thoại"
            size="control"
          />
        </Field>

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
            placeholder="Thông tin sức khỏe, lưu ý học tập hoặc ghi chú khác…"
            size="control"
          />
        </Field>
      </div>
    </NumberedSection>
  );

  const guardianSection = (
    <NumberedSection
      index={4}
      title="Phụ huynh và người giám hộ"
      description={
        isEditing
          ? "Một học sinh có thể liên kết nhiều phụ huynh, và một phụ huynh cũng có thể theo dõi nhiều học sinh."
          : "Một học sinh có thể liên kết nhiều phụ huynh, và một phụ huynh cũng có thể theo dõi nhiều học sinh. Phần này có thể bổ sung sau."
      }
    >
      <Controller
        control={form.control}
        name="guardians"
        render={({ field }) => (
          <GuardianRosterField
            value={field.value ?? []}
            onChange={field.onChange}
            mode={isEditing ? "edit" : "create"}
            disabled={isSubmitting}
            error={errors.guardians?.message}
          />
        )}
      />
    </NumberedSection>
  );

  const avatarSection = (
    <NumberedSection
      index={1}
      title="Ảnh đại diện"
      description="Giúp giáo viên nhận diện học sinh nhanh hơn."
    >
      {/* Creating carries its file inside the multipart request, so it may always
          upload. Editing stores the file against the account that owns it, so a
          profile with no account behind it gets the sample picker alone. */}
      <AvatarDraftField
        bare
        value={avatar}
        current={student?.avatar ?? null}
        name={student?.full_name ?? "Học sinh mới"}
        allowUpload={!isEditing || (typeof student.user_id === "number" && student.user_id > 0)}
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
          ? "Tên đăng nhập, trạng thái và mật khẩu của tài khoản."
          : "Thông tin dùng cho lần đăng nhập đầu tiên."
      }
    >
      {isEditing ? (
        <StudentAccountSection student={student} />
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
                placeholder="Ví dụ: hs_nguyenvanan"
                autoComplete="off"
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
                aria-controls="username"
                className="size-11 shrink-0 rounded-control rounded-l-none border-vc-control bg-background"
                onClick={generateUsername}
              >
                <RefreshCw aria-hidden="true" className="size-[17px]" />
              </Button>
            </div>
          </Field>

          <Field
            name="password"
            label="Mật khẩu"
            required
            hint="Khuyên học sinh đổi mật khẩu sau lần đăng nhập đầu."
            error={errors.password?.message}
          >
            <div className="relative">
              <Input
                {...form.register("password")}
                {...fieldAria(
                  "password",
                  errors.password?.message,
                  "Khuyên học sinh đổi mật khẩu sau lần đăng nhập đầu.",
                )}
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
        <BackLink href={LIST_HREF} label="Danh sách học sinh" />
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {isEditing ? "Hồ sơ học sinh" : "Hồ sơ mới"}
            </span>
            {/* The same code the list prints: the profile id as it stands, because
                `student_profiles` has no code column and a prefix invented here would
                put a second identifier in front of readers that nothing answers to. */}
            {isEditing ? (
              <span className="inline-flex min-h-[26px] items-center gap-1.5 rounded-control border border-vc-control bg-card px-2 py-1 font-mono text-[10px] font-medium tracking-[0.04em]">
                <span className="text-muted-foreground">Mã HS</span>
                {student.id}
              </span>
            ) : null}
          </div>
          <h2 className="text-[28px] leading-[1.3] font-semibold tracking-[-0.02em] md:text-[34px]">
            {isEditing ? "Sửa hồ sơ học sinh" : "Tạo học sinh"}
          </h2>
          <p className="mt-[7px] text-xs text-muted-foreground">
            {isEditing
              ? `Cập nhật hồ sơ, tài khoản và người liên hệ của ${student.full_name}.`
              : "Tạo tài khoản, bổ sung thông tin học vụ và kết nối phụ huynh trong một lần."}
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
              {isSubmitting ? "Đang lưu…" : isEditing ? "Lưu thay đổi" : "Tạo học sinh"}
            </Button>
          </>
        }
      >
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* The sheet is not clipped, so the column carrying its own paper texture
              rounds the outer corners it sits in: the top band below `lg`, the
              left half from `lg` up. */}
          <aside className="vc-form-grid-paper rounded-t-sheet border-b border-vc-rule p-7 max-md:px-4 max-md:py-5 lg:rounded-tr-none lg:rounded-bl-sheet lg:border-r lg:border-b-0">
            {avatarSection}
            {accountSection}
          </aside>

          <div className="p-7 lg:px-8">
            {profileSection}
            {guardianSection}
          </div>
        </div>
      </FormSheet>
    </div>
  );
}
