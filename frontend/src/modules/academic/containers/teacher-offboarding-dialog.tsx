"use client";

import { useState } from "react";
import { Check, CircleAlert, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { useTeacherOptions } from "../hooks/use-teachers";
import type { Teacher, TeacherClass } from "../types/academic";
import { canConfirmTeacherOffboarding, teacherOffboardingAssignments } from "../utils/teacher-offboarding";

type ReplacementMap = Record<number, number>;

/** Confirm retirement with one eligible replacement for every active lead class. */
export function TeacherOffboardingDialog({
  open,
  teacher,
  replacements,
  onReplacementsChange,
  onReplacementLabelChange,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  teacher: Teacher;
  replacements: ReplacementMap;
  onReplacementsChange: (value: ReplacementMap) => void;
  onReplacementLabelChange: (classId: number, label: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { leadClassIds, assistantClassIds } = teacherOffboardingAssignments(teacher);
  const canConfirm = canConfirmTeacherOffboarding(leadClassIds, replacements, teacher.id);

  /** Retain both the submitted ID and its label for the review summary. */
  function selectReplacement(classId: number, teacherId: number, label: string): void {
    onReplacementsChange({ ...replacements, [classId]: teacherId });
    onReplacementLabelChange(classId, label);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-sheet border-vc-wood bg-card sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chuyển giáo viên sang Đã nghỉ?</DialogTitle>
          <DialogDescription>
            {teacher.full_name} · mã hồ sơ #{teacher.profile_id} · trạng thái công tác riêng với khóa tài khoản.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="flex items-start gap-2 rounded-control border border-vc-rule bg-background p-3 text-sm leading-relaxed">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vc-orange-deep" />
            <p>
              Thay đổi chỉ áp dụng khi lưu hồ sơ. Mọi lớp đang phụ trách phải có giáo viên thay đang làm việc; nếu thiếu một người thay thì không có phân công nào đổi. Tài khoản đăng nhập không tự khóa.
            </p>
          </div>

          {leadClassIds.length > 0 ? (
            <section className="grid gap-3" aria-labelledby="offboarding-lead-title">
              <div className="grid gap-1">
                <h3 id="offboarding-lead-title" className="text-sm font-semibold">
                  Lớp đang phụ trách chính · {leadClassIds.length}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Mỗi lớp cần một giáo viên thay đang làm việc. Một người có thể nhận nhiều lớp.
                </p>
              </div>
              <ul className="grid gap-3">
                {leadClassIds.map((classId) => {
                  const schoolClass = teacher.classes.find((item) => item.id === classId);
                  if (schoolClass === undefined) return null;

                  return (
                    <li key={classId} className="grid gap-2 rounded-panel border border-vc-rule bg-background p-3 sm:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="grid gap-1">
                          <strong className="text-sm">
                            <span className="mr-2 font-mono text-xs text-muted-foreground">{schoolClass.code}</span>
                            {schoolClass.name}
                          </strong>
                          <span className="text-xs text-muted-foreground">
                            {schoolClass.subject_name ?? "Chưa gán môn học"}
                          </span>
                        </div>
                        {replacements[classId] === undefined ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                            <CircleAlert aria-hidden="true" className="size-3.5" />
                            Cần người thay
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-vc-leaf">
                            <Check aria-hidden="true" className="size-3.5" />
                            Đã chọn người thay
                          </span>
                        )}
                      </div>
                      <ReplacementTeacherField
                        teacher={teacher}
                        schoolClass={schoolClass}
                        selectedId={replacements[classId]}
                        onSelect={(teacherId, label) => selectReplacement(classId, teacherId, label)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {assistantClassIds.length > 0 ? (
            <section className="grid gap-2" aria-labelledby="offboarding-assistant-title">
              <h3 id="offboarding-assistant-title" className="text-sm font-semibold">
                Vai trò trợ giảng sẽ được gỡ · {assistantClassIds.length}
              </h3>
              <p className="text-xs text-muted-foreground">
                Không cần người thay; giáo viên phụ trách của mỗi lớp được giữ nguyên.
              </p>
              <ul className="grid divide-y divide-vc-rule rounded-panel border border-vc-rule bg-background px-3">
                {assistantClassIds.map((classId) => {
                  const schoolClass = teacher.assistant_classes.find((item) => item.id === classId);
                  return schoolClass === undefined ? null : (
                    <li key={classId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span><span className="mr-2 font-mono text-xs text-muted-foreground">{schoolClass.code}</span>{schoolClass.name}</span>
                      <span className="text-xs text-muted-foreground">Trợ giảng · phân công hiện tại</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {leadClassIds.length === 0 && assistantClassIds.length === 0 ? (
            <p className="rounded-control border border-vc-leaf/30 bg-vc-leaf/10 p-3 text-sm">
              Không có lớp đang hoạt động nào cần cập nhật phân công. Có thể xác nhận ngay.
            </p>
          ) : null}
        </div>

        <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 flex-row items-center justify-between gap-3 border-t border-vc-rule bg-card px-6 py-4">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {leadClassIds.length === 0
              ? assistantClassIds.length > 0
                ? `Sẽ gỡ ${assistantClassIds.length} vai trò trợ giảng.`
                : "Không có phân công đang hoạt động bị ảnh hưởng."
              : canConfirm
                ? `Đủ người thay cho ${leadClassIds.length} lớp.`
                : `Còn ${leadClassIds.filter((id) => replacements[id] === undefined).length}/${leadClassIds.length} lớp chưa có người thay.`}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="button" variant="destructive" disabled={!canConfirm} onClick={onConfirm}>
              <Check aria-hidden="true" />
              Xác nhận nghỉ việc
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Search only teachers whose active status and unlocked account make them eligible. */
function ReplacementTeacherField({
  teacher,
  schoolClass,
  selectedId,
  onSelect,
}: {
  teacher: Teacher;
  schoolClass: TeacherClass;
  selectedId: number | undefined;
  onSelect: (teacherId: number, label: string) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const query = useTeacherOptions(debouncedSearch);
  const rows = (query.data ?? []).filter((candidate) => candidate.id !== teacher.id);
  const assistants = teacher.assistant_classes.some((item) => item.id === schoolClass.id);

  return (
    <div className="grid gap-2">
      <label htmlFor={`offboarding-search-${schoolClass.id}`} className="sr-only">
        Tìm giáo viên thay cho lớp {schoolClass.code}
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`offboarding-search-${schoolClass.id}`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="control"
          placeholder="Tìm giáo viên thay theo tên hoặc mã…"
          className="pl-9"
        />
      </div>

      <div className="max-h-52 overflow-y-auto rounded-control border border-vc-rule">
        {query.isPending ? (
          <div className="grid gap-2 p-3" role="status" aria-label="Đang tải giáo viên đang làm việc">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : query.isError ? (
          <div className="grid justify-items-start gap-2 p-3 text-sm">
            <p role="alert">Không tải được danh sách giáo viên.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Không có giáo viên đang làm việc và có tài khoản mở phù hợp.</p>
        ) : (
          <ul role="radiogroup" aria-label={`Giáo viên thay cho lớp ${schoolClass.code}`} className="divide-y divide-vc-rule">
            {rows.map((candidate) => (
              <li key={candidate.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-vc-tint">
                  <input
                    type="radio"
                    name={`offboarding-replacement-${schoolClass.id}`}
                    value={candidate.id}
                    checked={selectedId === candidate.id}
                    onChange={() => onSelect(candidate.id, candidate.label)}
                    className="size-4 accent-vc-ink focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate text-sm font-medium">{candidate.label} <span className="font-mono text-xs text-muted-foreground">· #{candidate.id}</span></span>
                    <span className="text-xs text-muted-foreground">
                      {assistants && selectedId === candidate.id
                        ? "Đang là trợ giảng lớp này · sẽ chuyển sang phụ trách"
                        : "Đang làm việc · tài khoản mở"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Người thay hiện tại: {selectedId === undefined ? "Chưa chọn" : rows.find((row) => row.id === selectedId)?.label ?? `#${selectedId}`}
      </p>
    </div>
  );
}
