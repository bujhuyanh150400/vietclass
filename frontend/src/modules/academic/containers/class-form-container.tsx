"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type BaseSyntheticEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useWatch } from "react-hook-form";
import { AlertCircle } from "lucide-react";

import { ClassSubjectsField } from "../components/class-subjects-field";
import { ClassTeachingTeamField } from "../components/class-teaching-team-field";
import { NumberedSection } from "../components/numbered-section";
import { BackLink } from "@/components/shared/back-link";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { DateField } from "@/components/shared/date-field";
import { Field, fieldAria } from "@/components/shared/field";
import { FormShell } from "@/components/shared/form-shell";
import { SelectField } from "@/components/shared/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResourceForm } from "@/hooks/use-resource-form";

import { useCreateClass, useUpdateClass } from "../hooks/use-classes";
import {
  classCreateSchema,
  classEditSchema,
  emptyToNull,
  type ClassFormInput,
  type ClassFormValues,
} from "../schemas/academic-form-schema";
import type { GradeLevel, SchoolClass } from "../types/academic";
import { GRADE_LEVELS, GRADE_LEVEL_LABELS } from "../utils/labels";
import { classSubjectSetChanged } from "../utils/class-form-assignments";

/** Fields the API may report validation messages for. */
const FIELDS = [
  "code",
  "name",
  "subject_id",
  "subject_ids",
  "teacher_id",
  "assistant_teacher_ids",
  "grade_level",
  "max_students",
  "start_at",
  "end_at",
] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/academic/classes";

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
  const [confirmSubjects, setConfirmSubjects] = useState(false);
  const [subjectNames, setSubjectNames] = useState<Record<number, string>>(() =>
    Object.fromEntries(schoolClass?.subjects.map((subject) => [subject.id, subject.name]) ?? []),
  );

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
      subject_ids: schoolClass?.subjects.map((subject) => subject.id) ?? [],
      teacher_id: schoolClass?.teacher_id ?? 0,
      assistant_teacher_ids: schoolClass?.assistant_teachers.map((teacher) => teacher.id) ?? [],
      grade_level: schoolClass?.grade_level,
      max_students: schoolClass?.max_students ?? 20,
      start_at: schoolClass?.start_at ?? "",
      end_at: schoolClass?.end_at ?? "",
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const shared = {
        name: values.name,
        subject_id: values.subject_id,
        subject_ids: values.subject_ids,
        teacher_id: values.teacher_id,
        assistant_teacher_ids: values.assistant_teacher_ids,
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
      router.push(schoolClass === undefined ? LIST_HREF : `/academic/classes/${schoolClass.id}`);
      router.refresh();
    },
    successMessage: isEditing ? "Đã lưu thay đổi lớp học." : "Đã tạo lớp học.",
  });

  const errors = form.formState.errors;
  const gradeLevel = useWatch({ control: form.control, name: "grade_level" }) as GradeLevel | undefined;
  const subjectIds = useWatch({ control: form.control, name: "subject_ids" });
  const primarySubjectId = useWatch({ control: form.control, name: "subject_id" });
  const teacherId = useWatch({ control: form.control, name: "teacher_id" });
  const assistantTeacherIds = useWatch({ control: form.control, name: "assistant_teacher_ids" });

  const cancelHref = schoolClass === undefined ? LIST_HREF : `/academic/classes/${schoolClass.id}`;
  const previousSubjectIds = schoolClass?.subjects.map((subject) => subject.id) ?? [];
  const addedSubjects = (subjectIds ?? []).filter((id) => !previousSubjectIds.includes(id));
  const removedSubjects = previousSubjectIds.filter((id) => !(subjectIds ?? []).includes(id));
  /** Name each changed subject in the confirmation using labels retained across picker pages. */
  const nameSubjects = (ids: number[]) => ids.map((id) => subjectNames[id] ?? `#${id}`).join(", ");

  /** Validate the form before asking for confirmation only when its subject membership changes. */
  async function requestSubmit(event?: BaseSyntheticEvent): Promise<void> {
    if (isEditing && (schoolClass.active_students_count ?? 0) > 0 &&
      classSubjectSetChanged(previousSubjectIds, form.getValues("subject_ids"))) {
      event?.preventDefault();
      if (await form.trigger()) setConfirmSubjects(true);
      return;
    }

    await onSubmit(event);
  }

  return (
    <div className="grid w-full max-w-[900px] gap-6">
      <BackLink href={cancelHref} label={isEditing ? "Quay lại sổ lớp" : "Danh sách lớp học"} />
      <header className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          <span>{isEditing ? "Lớp hiện có" : "Lớp học mới"}</span>
          {isEditing && (schoolClass.active_students_count ?? 0) > 0 ? (
            <span className="rounded-control border border-vc-control bg-card px-2 py-1 font-mono tracking-normal normal-case">
              {schoolClass.active_students_count} học sinh đang học
            </span>
          ) : null}
        </div>
        <h2 className="text-[28px] leading-[1.3] font-semibold tracking-[-0.02em] md:text-[34px]">
          {isEditing ? "Chỉnh sửa lớp học" : "Tạo lớp học"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Cập nhật môn học, đội ngũ và thông tin vận hành. Mã lớp và ngày khai giảng được giữ cố định sau khi tạo."
            : "Thiết lập môn học và đội ngũ trước khi bắt đầu ghi danh học sinh."}
        </p>
      </header>

      <FormShell
        onSubmit={requestSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Lưu thay đổi" : "Tạo lớp học"}
        cancelHref={cancelHref}
        bare
        hideActions
      >
        <div className="overflow-visible rounded-sheet border border-vc-rule bg-card shadow-vc-sheet">
          <div className="grid gap-7 px-[17px] pt-[22px] pb-6 sm:px-8 sm:pt-7 sm:pb-[30px]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-vc-rule pb-4">
              <div className="grid gap-1">
                <h3 className="font-semibold">Thông tin lớp</h3>
                <p className="text-xs text-muted-foreground">Các trường có dấu sao được kiểm tra trước khi lưu.</p>
              </div>
              <span className="text-xs text-muted-foreground"><strong className="text-destructive">*</strong> Bắt buộc</span>
            </div>

            <NumberedSection index={1} headingLevel={4} title="Định danh và sĩ số" description="Khối quyết định môn học chọn được và học sinh được ghi danh.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="name" label="Tên lớp" required error={errors.name?.message}>
                  <Input
                    {...form.register("name")}
                    {...fieldAria("name", errors.name?.message)}
                    placeholder="Ví dụ: Toán 9A"
                    autoComplete="off"
                    size="control"
                  />
                </Field>

                <Field
                  name="code"
                  label="Mã lớp"
                  required={!isEditing}
                  hint={isEditing ? "Mã lớp không đổi để giữ liên kết ghi danh và lịch sử." : "Mã lớp cần duy nhất; ví dụ TOAN9-A."}
                  error={errors.code?.message}
                >
                  <Input
                    {...form.register("code")}
                    {...fieldAria("code", errors.code?.message)}
                    disabled={isEditing}
                    placeholder="TOAN-9A"
                    autoComplete="off"
                    size="control"
                  />
                </Field>

                <Controller
                  control={form.control}
                  name="grade_level"
                  render={({ field }) => (
                    <SelectField
                      name="grade_level"
                      label="Khối"
                      required
                      value={field.value}
                      choices={GRADE_CHOICES}
                      placeholder="Chọn khối"
                      onChange={field.onChange}
                      error={errors.grade_level?.message}
                      hint={isEditing && (schoolClass.active_students_count ?? 0) > 0 ? "Học sinh đang học phải cùng khối với lớp." : undefined}
                      size="control"
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="start_at"
                  render={({ field }) => (
                    <DateField
                      name="start_at"
                      label="Ngày khai giảng"
                      required={!isEditing}
                      hint={isEditing ? "Ngày khai giảng không đổi sau khi đã tạo." : "Ngày bắt đầu của kỳ ghi danh đầu tiên."}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.start_at?.message}
                      disabled={isEditing}
                      size="control"
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="end_at"
                  render={({ field }) => (
                    <DateField
                      name="end_at"
                      label="Ngày kết thúc"
                      hint="Không bắt buộc; có thể điều chỉnh khi kế hoạch lớp thay đổi."
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.end_at?.message}
                      size="control"
                    />
                  )}
                />

                <Field
                  name="max_students"
                  label="Sĩ số tối đa"
                  required
                  hint={isEditing ? `Không thể thấp hơn ${schoolClass.active_students_count ?? 0} học sinh đang ghi danh.` : "Giới hạn cứng của lớp; không có quyền ghi danh vượt sĩ số."}
                  error={errors.max_students?.message}
                >
                  <Input
                    {...form.register("max_students", { valueAsNumber: true })}
                    {...fieldAria("max_students", errors.max_students?.message)}
                    type="number"
                    min={isEditing ? schoolClass.active_students_count ?? 0 : 1}
                    max={32767}
                    inputMode="numeric"
                    size="control"
                  />
                </Field>
              </div>
            </NumberedSection>

            <NumberedSection index={2} headingLevel={4} title="Môn học" description="Chọn môn đang mở áp dụng cho khối của lớp. Học sinh ghi danh sẽ học toàn bộ môn đã chọn.">
              <ClassSubjectsField
                gradeLevel={gradeLevel ?? null}
                selectedIds={subjectIds ?? []}
                primaryId={primarySubjectId}
                currentSubjects={schoolClass?.subjects ?? []}
                error={errors.subject_ids?.message ?? errors.subject_id?.message}
                onSubjectLabel={(id, name) => setSubjectNames((names) => ({ ...names, [id]: name }))}
                onChange={(subjectIds, primarySubjectId) => {
                  form.setValue("subject_ids", subjectIds, { shouldDirty: true, shouldValidate: true });
                  form.setValue("subject_id", primarySubjectId, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </NumberedSection>

            <NumberedSection index={3} headingLevel={4} title="Đội ngũ giảng dạy" description="Một giáo viên phụ trách đang làm việc và không giới hạn trợ giảng. Một người chỉ giữ một vai trò trong lớp.">
              <ClassTeachingTeamField
                leadTeacherId={teacherId}
                assistantTeacherIds={assistantTeacherIds ?? []}
                currentLead={schoolClass === undefined ? null : {
                  id: schoolClass.teacher_id,
                  name: schoolClass.teacher_name ?? "Giáo viên hiện tại",
                  status: schoolClass.teacher_status ?? 0,
                }}
                currentAssistants={schoolClass?.assistant_teachers ?? []}
                leadError={errors.teacher_id?.message}
                assistantsError={errors.assistant_teacher_ids?.message}
                onLeadChange={(id) => form.setValue("teacher_id", id, { shouldDirty: true, shouldValidate: true })}
                onAssistantsChange={(ids) => form.setValue("assistant_teacher_ids", ids, { shouldDirty: true, shouldValidate: true })}
              />
            </NumberedSection>

            <aside className="flex items-start gap-2 border-t border-vc-rule pt-4 text-xs leading-relaxed text-muted-foreground" role="note">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong className="text-foreground">Sĩ số là giới hạn cứng.</strong> Khi lớp đã đủ chỗ, sổ lớp chặn thêm theo lô và chuyển lớp vào; không có thao tác ghi đè.
                {isEditing && (schoolClass.active_students_count ?? 0) > 0 ? " Đổi tập môn của lớp đang có học sinh cần xác nhận trước khi lưu." : ""}
              </p>
            </aside>
          </div>

          <div className="flex min-h-[78px] flex-wrap items-center justify-end gap-2.5 border-t border-vc-rule bg-card px-8 py-4 md:rounded-b-[9px] max-md:sticky max-md:bottom-0 max-md:z-10 max-md:px-[17px] max-md:py-[13px] max-md:shadow-[0_-5px_20px_oklch(.3_.04_60_/_0.06)] max-[390px]:px-[14px]">
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={isSubmitting}
              className="h-11 min-w-[108px] flex-1 rounded-control md:flex-none"
            >
              <Link href={cancelHref}>Hủy</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 min-w-[154px] flex-1 rounded-control font-semibold shadow-vc-raised max-[390px]:min-w-[144px] md:flex-none"
            >
              {isSubmitting ? "Đang lưu…" : isEditing ? "Lưu thay đổi" : "Tạo lớp học"}
            </Button>
          </div>
        </div>
      </FormShell>
      <ConfirmActionDialog
        open={confirmSubjects}
        onOpenChange={setConfirmSubjects}
        title="Đổi môn học của lớp đang có học sinh?"
        description={`${schoolClass?.active_students_count ?? 0} học sinh đang học ${schoolClass?.code ?? ""} sẽ học theo tập môn mới ngay khi lưu. ${addedSubjects.length > 0 ? `Thêm: ${nameSubjects(addedSubjects)}. ` : ""}${removedSubjects.length > 0 ? `Bỏ: ${nameSubjects(removedSubjects)}. ` : ""}Sau khi lưu: ${nameSubjects(subjectIds ?? [])}. Không có kỳ ghi danh nào bị đóng hay tạo mới, và thay đổi này không ghi sự kiện vào lịch sử ghi danh. Lớp chỉ nhận chuyển từ lớp có đúng tập môn mới.`}
        confirmLabel="Đổi môn và lưu lớp"
        errorMessage={null}
        isPending={isSubmitting}
        onConfirm={() => {
          setConfirmSubjects(false);
          void onSubmit();
        }}
      />
    </div>
  );
}
