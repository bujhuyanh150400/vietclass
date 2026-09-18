"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";

import { BackLink } from "@/components/shared/back-link";
import { Field, fieldAria } from "@/components/shared/field";
import { FormSheet } from "@/components/shared/form-sheet";
import { SelectField } from "@/components/shared/select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResourceForm } from "@/hooks/use-resource-form";

import { SHEET_FIELD_GRID, SHEET_FIELD_TYPE } from "../components/form-control";
import { NumberedSection } from "../components/numbered-section";
import { useCreateRoom, useUpdateRoom } from "../hooks/use-rooms";
import {
  emptyToNull,
  roomFormSchema,
  type RoomFormInput,
  type RoomFormValues,
} from "../schemas/academic-form-schema";
import type { Room, RoomFacility } from "../types/academic";
import {
  ROOM_FACILITIES,
  ROOM_FACILITY_LABELS,
  ROOM_STATUSES,
  ROOM_STATUS_LABELS,
} from "../utils/labels";

/** Fields the API may report validation messages for. */
const FIELDS = ["name", "capacity", "status", "location", "facilities", "note"] as const;

/** Where the room form returns after a successful submission. */
const LIST_HREF = "/academic/rooms";

/**
 * Coordinates creating and editing a room with the shared resource form behavior.
 *
 * Status is on the form because it is a property of the room like any other, and
 * somebody recording a room under maintenance should not have to save it first and
 * change it second. The list keeps its own one-step status change for the times a
 * reader wants to take a room out of circulation without opening the form.
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
      // A new room is available unless somebody says otherwise, which matches the
      // column default the API applies when no status is sent.
      status: room?.status ?? 0,
      location: room?.location ?? "",
      facilities: room?.facilities ?? [],
      note: room?.note ?? "",
    },
    fieldNames: FIELDS,
    submit: async (values) => {
      const body = {
        name: values.name,
        capacity: values.capacity,
        status: values.status,
        location: emptyToNull(values.location),
        // Ascending order, so a room's facilities read the same however they were
        // ticked and two otherwise identical rooms compare equal.
        facilities: [...values.facilities].sort((left, right) => left - right),
        note: emptyToNull(values.note),
      };

      return isEditing ? update.mutateAsync(body) : create.mutateAsync(body);
    },
    onSuccess: () => {
      router.push(LIST_HREF);
      router.refresh();
    },
    successMessage: isEditing ? "Đã lưu thay đổi phòng học." : "Đã tạo phòng học.",
  });

  const errors = form.formState.errors;
  const location = form.watch("location");
  const note = form.watch("note");

  return (
    <div className="grid max-w-4xl gap-6">
      <BackLink href={LIST_HREF} label="Danh sách phòng học" />

      <div>
        <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-vc-orange-deep">
          {isEditing ? "CẬP NHẬT PHÒNG HỌC" : "PHÒNG HỌC MỚI"}
        </p>
        <h2 className="mt-1 text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
          {isEditing ? "Sửa phòng học" : "Tạo phòng học"}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Bổ sung thông tin cơ bản để phòng sẵn sàng cho việc sắp xếp lớp học.
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
            <Button
              type="submit"
              className="rounded-control border border-vc-wood shadow-vc-raised"
              disabled={isSubmitting}
            >
              {isEditing ? "Lưu thay đổi" : "Tạo phòng học"}
            </Button>
          </>
        }
      >
        <div className="px-5 py-6 lg:px-8 lg:py-8">
          <NumberedSection
            index={1}
            title="Thông tin phòng học"
            description="Chỉ phòng đang hoạt động mới được xếp lịch."
          >
            <div className={`${SHEET_FIELD_GRID} ${SHEET_FIELD_TYPE}`}>
              <Field name="name" label="Tên phòng" required error={errors.name?.message}>
                <Input
                  {...form.register("name")}
                  {...fieldAria("name", errors.name?.message)}
                  size="control"
                  placeholder="Ví dụ: Phòng học 301"
                  autoComplete="off"
                />
              </Field>

              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <SelectField
                    name="status"
                    label="Trạng thái"
                    required
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    error={errors.status?.message}
                    size="control"
                    choices={ROOM_STATUSES.map((status) => ({
                      value: status,
                      label: ROOM_STATUS_LABELS[status],
                    }))}
                  />
                )}
              />

              <Field
                name="capacity"
                label="Sức chứa"
                required
                hint="Số chỗ ngồi, có thể bằng 0 khi chưa xác định."
                error={errors.capacity?.message}
              >
                <Input
                  {...form.register("capacity", { valueAsNumber: true })}
                  {...fieldAria(
                    "capacity",
                    errors.capacity?.message,
                    "Số chỗ ngồi, có thể bằng 0 khi chưa xác định.",
                  )}
                  size="control"
                  type="number"
                  min={0}
                  max={32767}
                  inputMode="numeric"
                />
              </Field>

              <Controller
                control={form.control}
                name="facilities"
                render={({ field }) => {
                  // The schema gives `facilities` a default, so its *input* type is
                  // optional even though every saved room has a list.
                  const selected = field.value ?? [];

                  return (
                    <Field
                      name="facilities"
                      label="Tiện ích"
                      hint="Không bắt buộc. Có thể bổ sung sau."
                      error={errors.facilities?.message}
                      className="sm:col-span-2"
                    >
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {ROOM_FACILITIES.map((facility) => (
                          <label
                            key={facility}
                            className="flex h-11 items-center gap-2 rounded-control border border-vc-control px-3 text-xs hover:bg-vc-tint"
                          >
                            <Checkbox
                              checked={selected.includes(facility)}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  toggleFacility(selected, facility, checked === true),
                                )
                              }
                            />
                            {ROOM_FACILITY_LABELS[facility]}
                          </label>
                        ))}
                      </div>
                    </Field>
                  );
                }}
              />

              <Field
                name="location"
                label="Vị trí"
                hint={`${location?.length ?? 0}/500 ký tự`}
                error={errors.location?.message}
                className="sm:col-span-2"
              >
                <Textarea
                  {...form.register("location")}
                  {...fieldAria("location", errors.location?.message)}
                  size="control"
                  rows={3}
                  placeholder="Ví dụ: Tầng 2 · Dãy A, gần cầu thang"
                />
              </Field>

              <Field
                name="note"
                label="Ghi chú"
                hint={`${note?.length ?? 0}/2000 ký tự`}
                error={errors.note?.message}
                className="sm:col-span-2"
              >
                <Textarea
                  {...form.register("note")}
                  {...fieldAria("note", errors.note?.message)}
                  size="control"
                  rows={4}
                  placeholder="Lưu ý khi sử dụng phòng…"
                />
              </Field>
            </div>
          </NumberedSection>
        </div>
      </FormSheet>
    </div>
  );
}

/** Toggles one facility while preserving the API's ascending numeric order. */
function toggleFacility(
  values: RoomFacility[],
  facility: RoomFacility,
  checked: boolean,
): RoomFacility[] {
  return (checked ? [...values, facility] : values.filter((value) => value !== facility)).sort(
    (left, right) => left - right,
  );
}
