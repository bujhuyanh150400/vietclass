"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isApiClientError } from "@/lib/api/api-client-error";

import { useDeleteGuardian, useStudentOptions } from "../hooks/use-guardian-records";
import { guardianDeleteRequirementsMet } from "../utils/guardian-list-controls";
import type { Guardian } from "../types/academic";

/** Requires an eligible guardian choice for every shared primary before deletion. */
export function GuardianDeleteDialog({ guardian, open, onOpenChange, onDeleted }: { guardian: Guardian; open: boolean; onOpenChange: (open: boolean) => void; onDeleted: () => void }) {
  const mutation = useDeleteGuardian(guardian.id);
  const linkedStudentIds = guardian.students.map((student) => student.id);
  const students = useStudentOptions(linkedStudentIds);
  const [replacements, setReplacements] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const primaryStudents = guardian.students.filter((student) => student.is_primary);
  /** Returns only linked guardians eligible to replace the deleted profile for one student. */
  const availableFor = (studentId: number) => {
    const student = students.data?.find((candidate) => candidate.id === studentId);
    return student?.guardians.filter((candidate) => candidate.profile_id !== guardian.id) ?? [];
  };
  const ready = students.isSuccess && guardianDeleteRequirementsMet(
    guardian.id,
    linkedStudentIds,
    students.data ?? [],
    replacements,
  );

  /** Sends the explicit replacement map and preserves the dialog on refusal. */
  async function confirm(): Promise<void> {
    setError(null);
    try {
      await mutation.mutateAsync({ replacements });
      onOpenChange(false);
      onDeleted();
    } catch (failure) {
      setError(isApiClientError(failure) ? failure.message : "Không xóa được hồ sơ phụ huynh.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Xóa hồ sơ phụ huynh?</DialogTitle></DialogHeader>
        <p role="alert" className="text-sm">Hồ sơ và mọi liên kết sẽ bị xóa; học sinh vẫn được giữ. Không tự động chọn người liên hệ thay thế.</p>
        {primaryStudents.map((student) => {
          const available = availableFor(student.id);
          if (available.length === 0) return null;
          return <label key={student.id} className="grid gap-1 text-sm">Người thay thế cho {student.full_name}<select required value={replacements[student.id] ?? ""} onChange={(event) => setReplacements((current) => ({ ...current, [student.id]: Number(event.target.value) }))}><option value="">Chọn hồ sơ đã liên kết</option>{available.map((option) => <option key={option.profile_id} value={option.profile_id}>{option.full_name}{option.phone ? ` · ${option.phone}` : ""}</option>)}</select></label>;
        })}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button><Button variant="destructive" disabled={mutation.isPending || !ready} onClick={() => void confirm()}>Xóa hồ sơ</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
