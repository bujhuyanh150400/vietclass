"use client";

import type { UseQueryResult } from "@tanstack/react-query";

import { AsyncSelectField } from "@/components/shared/async-select-field";

import type { Option } from "../types/schedule";
import { SCHEDULE_TEACHER_ROLE_LABELS } from "../utils/labels";

/**
 * The signature the module's `useTeacherOptions` hook already has: a search term
 * in, a query of matching people out. Passing the hook keeps this component free
 * of any query of its own while the caching and endpoint stay where they are.
 */
type UseOptionsHook = (search: string) => UseQueryResult<Option[]>;

/**
 * Renders the two pickers that staff a fixed schedule: one main teacher and any
 * number of assistants.
 *
 * The shape of the controls is what makes two of the API's three rules hard to
 * break. "Exactly one main teacher" is the only thing a single-choice picker can
 * express, and a multi-select cannot hold the same assistant twice. The third
 * rule — nobody in both roles — is guarded two ways: the person already chosen as
 * main teacher is withheld from the assistant list, and the form schema still
 * refuses the combination, because withholding an option cannot undo a choice made
 * in the other order.
 *
 * None of this is enforcement. The Action owns all three rules and answers `422`
 * whatever a form lets through; this only means a reader is told at once instead
 * of after a round trip.
 *
 * Presentational: it receives its values, its callbacks, and its options hook.
 */
export function TeacherRosterField({
  useOptions,
  mainTeacherId,
  assistantTeacherIds,
  onMainTeacherChange,
  onAssistantTeachersChange,
  mainTeacherError,
  assistantTeachersError,
  mainTeacherLabel,
  assistantTeacherLabels,
  disabled = false,
}: {
  useOptions: UseOptionsHook;
  mainTeacherId: number;
  assistantTeacherIds: number[];
  onMainTeacherChange: (id: number) => void;
  onAssistantTeachersChange: (ids: number[]) => void;
  mainTeacherError?: string;
  assistantTeachersError?: string;
  /** The main teacher's name as the loaded record reported it, for an edit form. */
  mainTeacherLabel?: string;
  /** The assistants' names as the loaded record reported them, keyed by id. */
  assistantTeacherLabels?: Record<number, string>;
  disabled?: boolean;
}) {
  return (
    <>
      <AsyncSelectField
        name="main_teacher_id"
        label={SCHEDULE_TEACHER_ROLE_LABELS[0]}
        required
        useOptions={useOptions}
        value={mainTeacherId === 0 ? undefined : mainTeacherId}
        onChange={onMainTeacherChange}
        selectedLabel={mainTeacherLabel}
        error={mainTeacherError}
        hint="Mỗi lịch cố định có đúng một giáo viên chính."
        placeholder="Chọn giáo viên chính"
        searchPlaceholder="Tìm giáo viên…"
        emptyMessage="Không tìm thấy giáo viên phù hợp."
        disabled={disabled}
      />

      <AsyncSelectField
        multiple
        name="assistant_teacher_ids"
        label={SCHEDULE_TEACHER_ROLE_LABELS[1]}
        useOptions={useOptions}
        value={assistantTeacherIds}
        onChange={onAssistantTeachersChange}
        selectedLabels={assistantTeacherLabels}
        filterOption={(option) => option.id !== mainTeacherId}
        error={assistantTeachersError}
        hint="Không bắt buộc. Chỉ hiển thị giáo viên đang làm việc."
        placeholder="Chọn trợ giảng"
        searchPlaceholder="Tìm giáo viên…"
        emptyMessage="Không tìm thấy giáo viên phù hợp."
        disabled={disabled}
      />
    </>
  );
}
