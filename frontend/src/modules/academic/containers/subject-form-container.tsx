"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";

import { BackLink } from "@/components/shared/back-link";
import { Field, fieldAria } from "@/components/shared/field";
import { FormSheet } from "@/components/shared/form-sheet";
import { SelectField } from "@/components/shared/select-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useResourceForm } from "@/hooks/use-resource-form";

import { NumberedSection } from "../components/numbered-section";
import { SHEET_CONTROL, SHEET_FIELD_GRID, SHEET_FIELD_TYPE, SHEET_TEXTAREA } from "../components/form-control";
import { useCreateSubject, useUpdateSubject } from "../hooks/use-subjects";
import {
  emptyToNull,
  subjectFormSchema,
  type SubjectFormInput,
  type SubjectFormValues,
} from "../schemas/academic-form-schema";
import type { GradeLevel, Subject } from "../types/academic";
import { GRADE_LEVELS, GRADE_LEVEL_LABELS } from "../utils/labels";

/** Fields the API may report validation messages for. */
const FIELDS = ["name", "description", "grade_levels", "is_active"] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/academic/subjects";

/**
 * Coordinates creating and editing a subject.
 *
 * It keeps the configuration a class depends on together: name, status, description,
 * and the grades the subject may serve.
 */
export function SubjectFormContainer({ subject }: { subject?: Subject }) {
  const router = useRouter();
  const create = useCreateSubject();
  const update = useUpdateSubject(subject?.id ?? 0);

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    SubjectFormInput,
    SubjectFormValues
  >({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: subject?.name ?? "",
      description: subject?.description ?? "",
      grade_levels: subject?.grade_levels ?? [],
      is_active: subject?.is_active ?? true,
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const body = {
        name: values.name,
        description: emptyToNull(values.description),
        grade_levels: [...values.grade_levels].sort((left, right) => left - right),
        is_active: values.is_active,
      };

      return subject === undefined
        ? create.mutateAsync(body)
        : update.mutateAsync(body);
    },
    onSuccess: () => {
      router.push(LIST_HREF);
      router.refresh();
    },
    successMessage:
      subject === undefined ? "Đã tạo môn học." : "Đã lưu thay đổi môn học.",
  });

  const errors = form.formState.errors;
  const description = form.watch("description");

  return (
    <div className="grid max-w-4xl gap-6">
      <BackLink href={LIST_HREF} label="Danh sách môn học" />

      <div>
        <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-vc-orange-deep">
          {subject === undefined ? "MÔN HỌC MỚI" : "CẬP NHẬT MÔN HỌC"}
        </p>
        <h2 className="mt-1 text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
          {subject === undefined ? "Tạo môn học" : "Sửa môn học"}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Xác định môn học, khối áp dụng và trạng thái sử dụng khi mở lớp.
        </p>
      </div>

      <FormSheet
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        actions={
          <>
            <Button type="button" variant="outline" asChild disabled={isSubmitting}>
              <Link href={LIST_HREF}>Hủy</Link>
            </Button>
            <Button type="submit" className="rounded-control border border-vc-wood shadow-vc-raised" disabled={isSubmitting}>
              {subject === undefined ? "Tạo môn học" : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="px-5 py-6 lg:px-8 lg:py-8">
          <NumberedSection index={1} title="Thông tin môn học" description="Các lớp mới chỉ chọn được môn đang hoạt động và đúng khối áp dụng.">
            <div className={`${SHEET_FIELD_GRID} ${SHEET_FIELD_TYPE}`}>
              <Field name="name" label="Tên môn học" required error={errors.name?.message}>
                <Input {...form.register("name")} {...fieldAria("name", errors.name?.message)} className={SHEET_CONTROL} placeholder="Ví dụ: Toán nâng cao" autoComplete="off" />
              </Field>

              <Controller control={form.control} name="is_active" render={({ field }) => (
                <SelectField name="is_active" label="Trạng thái" required value={field.value ? 1 : 0} onChange={(value) => field.onChange(value === 1)} error={errors.is_active?.message} triggerClassName={SHEET_CONTROL} choices={[{ value: 1, label: "Hoạt động" }, { value: 0, label: "Ngừng hoạt động" }]} />
              )} />

              <Field name="description" label="Mô tả" hint={`${description?.length ?? 0}/500 ký tự`} error={errors.description?.message} className="sm:col-span-2">
                <Textarea {...form.register("description")} {...fieldAria("description", errors.description?.message)} className={SHEET_TEXTAREA} rows={4} />
              </Field>

              <Controller control={form.control} name="grade_levels" render={({ field }) => (
                <Field name="grade_levels" label="Khối áp dụng" required hint="Chọn ít nhất một khối." error={errors.grade_levels?.message} className="sm:col-span-2">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {GRADE_LEVELS.map((gradeLevel) => {
                      const selected = field.value.includes(gradeLevel);
                      return <label key={gradeLevel} className="flex h-11 items-center gap-2 rounded-control border border-vc-control px-3 text-xs hover:bg-vc-tint">
                        <Checkbox checked={selected} onCheckedChange={(checked) => field.onChange(toggleGrade(field.value as GradeLevel[], gradeLevel, checked === true))} />
                        {GRADE_LEVEL_LABELS[gradeLevel]}
                      </label>;
                    })}
                  </div>
                </Field>
              )} />
            </div>
          </NumberedSection>
        </div>
      </FormSheet>
    </div>
  );
}

/** Toggles one grade while preserving the API's ascending numeric order. */
function toggleGrade(values: GradeLevel[], gradeLevel: GradeLevel, checked: boolean): GradeLevel[] {
  return (checked ? [...values, gradeLevel] : values.filter((value) => value !== gradeLevel))
    .sort((left, right) => left - right) as GradeLevel[];
}
