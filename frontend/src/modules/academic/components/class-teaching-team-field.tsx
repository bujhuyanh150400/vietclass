"use client";

import { useId, useState } from "react";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useTeacherPickerOptions } from "../hooks/use-teachers";
import type { ClassTeacherAssignment } from "../types/academic";
import { teacherDisabledReason } from "../utils/eligibility-reasons";
import { toggleAssistantTeacher } from "../utils/class-form-assignments";

/** Search and assign one lead teacher plus any number of active assistants. */
export function ClassTeachingTeamField({
  leadTeacherId,
  assistantTeacherIds,
  currentLead,
  currentAssistants,
  leadError,
  assistantsError,
  onLeadChange,
  onAssistantsChange,
}: {
  leadTeacherId: number;
  assistantTeacherIds: number[];
  currentLead: ClassTeacherAssignment | null;
  currentAssistants: ClassTeacherAssignment[];
  leadError?: string;
  assistantsError?: string;
  onLeadChange: (teacherId: number) => void;
  onAssistantsChange: (teacherIds: number[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [knownTeacherNames, setKnownTeacherNames] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      [currentLead, ...currentAssistants].flatMap((teacher) =>
        teacher === null || teacher.name === null ? [] : [[teacher.id, teacher.name]],
      ),
    ),
  );
  const leadRadioName = useId();
  const query = useTeacherPickerOptions(search, page);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  const leadName = knownTeacherNames[leadTeacherId] ?? currentLead?.name ?? "Chưa chọn";
  const assistantNames = assistantTeacherIds
    .map((id) => knownTeacherNames[id])
    .filter((name): name is string => name !== undefined);

  /** Remember a fetched teacher label before its row can disappear from a search page. */
  function rememberTeacher(id: number): void {
    const teacher = rows.find((row) => row.id === id);
    if (teacher !== undefined) {
      setKnownTeacherNames((known) => ({ ...known, [id]: teacher.full_name }));
    }
  }

  /** Toggle an assistant after retaining the selected teacher's display name. */
  function toggleAssistant(id: number): void {
    rememberTeacher(id);
    onAssistantsChange(toggleAssistantTeacher(assistantTeacherIds, id, leadTeacherId));
  }

  return (
    <div className="grid gap-4">
      <Field
        name="teacher_id"
        label="Giáo viên phụ trách"
        required
        hint={`Phụ trách hiện tại: ${leadName}. Một giáo viên không thể giữ đồng thời cả hai vai trò.`}
        error={leadError}
      >
        <Input
          id="class-teacher-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          size="control"
          placeholder="Tìm theo tên hoặc số điện thoại…"
          aria-label="Tìm giáo viên trong đội ngũ lớp"
        />
      </Field>

      <Field
        name="assistant_teacher_ids"
        label="Trợ giảng"
        hint={assistantNames.length > 0 ? `Đang chọn: ${assistantNames.join(", ")}.` : "Có thể chọn nhiều giáo viên đang làm việc."}
        error={assistantsError}
      >
        <div className="max-h-72 overflow-y-auto rounded-panel border border-vc-rule bg-background">
          {query.isPending ? (
            <div className="grid gap-3 p-4" aria-label="Đang tải giáo viên">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-2/3" />
            </div>
          ) : query.isError ? (
            <div className="grid justify-items-center gap-2 p-5 text-center text-sm">
              <p role="alert">Không tải được danh sách giáo viên.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Không tìm thấy giáo viên phù hợp.
            </p>
          ) : (
            <ul className="divide-y divide-vc-rule">
              {rows.map((teacher) => {
                const isLead = leadTeacherId === teacher.id;
                const isAssistant = assistantTeacherIds.includes(teacher.id);
                const assistantReason = teacherDisabledReason(teacher.status, teacher.id, leadTeacherId || null);
                const leadReason = teacher.status !== 0
                  ? "Giáo viên đã nghỉ."
                  : isAssistant && !isLead
                    ? "Đang là trợ giảng; hãy gỡ vai trò đó trước."
                    : null;

                return (
                  <li key={teacher.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-4">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="truncate text-sm font-medium">{teacher.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        Mã hồ sơ #{teacher.id} · {teacher.status === 0 ? "Đang làm việc" : "Đã nghỉ"}
                      </span>
                    </div>
                    <label className={`flex items-center gap-2 text-xs ${leadReason && !isLead ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                      <input
                        type="radio"
                        name={leadRadioName}
                        value={teacher.id}
                        checked={isLead}
                        disabled={leadReason !== null && !isLead}
                        onChange={() => {
                          setKnownTeacherNames((known) => ({ ...known, [teacher.id]: teacher.full_name }));
                          onLeadChange(teacher.id);
                        }}
                        aria-label={`Chọn ${teacher.full_name} làm giáo viên phụ trách`}
                        className="accent-vc-ink focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      Phụ trách
                    </label>
                    <label className={`flex items-center gap-2 text-xs ${assistantReason && !isAssistant ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                      <Checkbox
                        id={`class-assistant-${teacher.id}`}
                        checked={isAssistant}
                        disabled={assistantReason !== null && !isAssistant}
                        onCheckedChange={() => toggleAssistant(teacher.id)}
                        aria-label={`Chọn ${teacher.full_name} làm trợ giảng`}
                      />
                      Trợ giảng
                    </label>
                    {leadReason !== null || assistantReason !== null ? (
                      <p className="text-xs text-muted-foreground sm:col-span-3">
                        {isLead ? "Đang phụ trách lớp." : leadReason ?? assistantReason}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Field>

      {meta !== undefined && meta.last_page > 1 ? (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Trang {meta.current_page} / {meta.last_page}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => current - 1)}>
              Trước
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={page >= meta.last_page || query.isFetching} onClick={() => setPage((current) => current + 1)}>
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Đang có {leadTeacherId > 0 ? 1 : 0} giáo viên phụ trách và {assistantTeacherIds.length} trợ giảng.
      </p>
    </div>
  );
}
