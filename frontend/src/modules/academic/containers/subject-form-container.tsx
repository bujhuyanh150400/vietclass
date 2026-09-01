"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/data-table";
import { Field, fieldAria } from "@/components/shared/field";
import { FormShell } from "@/components/shared/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResourceForm } from "@/hooks/use-resource-form";

import { useCreateSubject, useUpdateSubject } from "../hooks/use-subjects";
import {
  emptyToNull,
  subjectFormSchema,
  type SubjectFormInput,
  type SubjectFormValues,
} from "../schemas/academic-form-schema";
import type { Subject } from "../types/academic";

/** Fields the API may report validation messages for. */
const FIELDS = ["name", "description"] as const;

/** Where the form returns to once it is done. */
const LIST_HREF = "/academic/subjects";

/**
 * Coordinates creating and editing a subject.
 *
 * Locking is deliberately not part of this form: it carries a rule about the
 * classes using the subject and lives on the list screen, which is also where the
 * count that rule depends on is shown.
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
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const body = {
        name: values.name,
        description: emptyToNull(values.description),
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

  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        backHref={LIST_HREF}
        backLabel="Danh sách môn học"
        title={subject === undefined ? "Thêm môn học" : "Sửa môn học"}
        description={
          subject === undefined
            ? "Môn học mới sẽ ở trạng thái đang mở và chọn được ngay khi tạo lớp."
            : "Việc khóa hoặc mở môn học được thực hiện ở danh sách môn học."
        }
      />

      <FormShell
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={subject === undefined ? "Tạo môn học" : "Lưu thay đổi"}
        cancelHref={LIST_HREF}
      >
        <Field
          name="name"
          label="Tên môn học"
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input
            {...form.register("name")}
            {...fieldAria("name", errors.name?.message)}
            placeholder="Ví dụ: Toán nâng cao"
            autoComplete="off"
          />
        </Field>

        <Field
          name="description"
          label="Mô tả"
          hint="Không bắt buộc."
          error={errors.description?.message}
          className="sm:col-span-2"
        >
          <Textarea
            {...form.register("description")}
            {...fieldAria("description", errors.description?.message, "Không bắt buộc.")}
            rows={4}
          />
        </Field>
      </FormShell>
    </div>
  );
}
