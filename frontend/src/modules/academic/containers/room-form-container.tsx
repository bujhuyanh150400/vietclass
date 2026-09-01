"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/data-table";
import { Field, fieldAria } from "@/components/shared/field";
import { FormShell } from "@/components/shared/form-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResourceForm } from "@/hooks/use-resource-form";

import { useCreateRoom, useUpdateRoom } from "../hooks/use-rooms";
import {
  emptyToNull,
  roomFormSchema,
  type RoomFormInput,
  type RoomFormValues,
} from "../schemas/academic-form-schema";
import type { Room } from "../types/academic";

/** Fields the API may report validation messages for. */
const FIELDS = ["name", "capacity", "note"] as const;

/** Where the room form returns after a successful submission. */
const LIST_HREF = "/academic/rooms";

/**
 * Coordinates creating and editing a room with the shared resource form behavior.
 *
 * Status is intentionally absent: it has its own confirmed operation on the list,
 * where readers can see its current state before taking a room out of circulation.
 */
export function RoomFormContainer({ room }: { room?: Room }) {
  const router = useRouter();
  const isEditing = room !== undefined;
  const create = useCreateRoom();
  const update = useUpdateRoom(room?.id ?? 0);

  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    RoomFormInput,
    RoomFormValues
  >({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: room?.name ?? "",
      capacity: room?.capacity ?? 0,
      note: room?.note ?? "",
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const body = {
        name: values.name,
        capacity: values.capacity,
        note: emptyToNull(values.note),
      };

      return isEditing ? update.mutateAsync(body) : create.mutateAsync(body);
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
        backHref={LIST_HREF}
        backLabel="Danh sách phòng học"
        title={isEditing ? "Sửa phòng học" : "Thêm phòng học"}
        description={
          isEditing
            ? "Trạng thái phòng được đổi tại danh sách phòng học."
            : "Phòng học mới sẽ ở trạng thái hoạt động."
        }
      />

      <FormShell
        onSubmit={onSubmit}
        alertMessage={alertMessage}
        isSubmitting={isSubmitting}
        submitLabel={isEditing ? "Lưu thay đổi" : "Tạo phòng học"}
        cancelHref={LIST_HREF}
      >
        <Field name="name" label="Tên phòng học" required error={errors.name?.message}>
          <Input
            {...form.register("name")}
            {...fieldAria("name", errors.name?.message)}
            placeholder="Ví dụ: Phòng A1"
            autoComplete="off"
          />
        </Field>

        <Field
          name="capacity"
          label="Sức chứa"
          required
          hint="Số chỗ ngồi, có thể bằng 0 khi chưa xác định."
          error={errors.capacity?.message}
        >
          <Input
            {...form.register("capacity", { valueAsNumber: true })}
            {...fieldAria("capacity", errors.capacity?.message, "Số chỗ ngồi, có thể bằng 0 khi chưa xác định.")}
            type="number"
            min={0}
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
            rows={4}
          />
        </Field>
      </FormShell>
    </div>
  );
}
