"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { GuardianRequest } from "../types/academic-requests";
import type { GuardianRelationship, Student } from "../types/academic";
import {
  guardianReplacementChoices,
  guardianReplacementRequirementsMet,
} from "../utils/guardian-list-controls";
import { GENDER_LABELS } from "../utils/labels";

/** Renders guardian profile fields and an explicit student/primary roster. */
export function GuardianForm({
  values,
  students,
  guardianId,
  guardianStudentIds = [],
  pending,
  onChange,
  onSubmit,
  onCancel,
}: {
  values: GuardianRequest;
  students: Student[];
  guardianId?: number;
  guardianStudentIds?: number[];
  pending: boolean;
  onChange: (values: GuardianRequest) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const update = <K extends keyof GuardianRequest>(key: K, value: GuardianRequest[K]) =>
    onChange({ ...values, [key]: value });

  /** Updates only the selected student's relationship or primary flag. */
  const updateStudent = (id: number, changes: Partial<{ relationship: GuardianRelationship; is_primary: boolean }>) => {
    const replacements = { ...values.replacements };
    if (changes.is_primary === true) {
      delete replacements[id];
    }
    onChange({
      ...values,
      students: values.students.map((student) => (
        student.student_profile_id === id ? { ...student, ...changes } : student
      )),
      replacements,
    });
  };

  const replacementReady = guardianId === undefined || guardianReplacementRequirementsMet(
    guardianId,
    guardianStudentIds,
    students,
    values.students,
    values.replacements,
  );

  const toggleStudent = (id: number) => {
    const existing = values.students.find((student) => student.student_profile_id === id);
    if (existing) {
      update("students", values.students.filter((student) => student.student_profile_id !== id));
      return;
    }
    update("students", [
      ...values.students,
      { student_profile_id: id, relationship: 2, is_primary: values.students.length === 0 },
    ]);
  };

  return (
    <form className="grid max-w-3xl gap-5" onSubmit={(event) => {
      if (!replacementReady) {
        event.preventDefault();
        return;
      }
      onSubmit(event);
    }}>
      <div className="grid gap-3 rounded-lg border bg-card p-5">
        <label>Họ và tên<Input required value={values.full_name} onChange={(event) => update("full_name", event.target.value)} /></label>
        <label>Số điện thoại<Input required value={values.phone} onChange={(event) => update("phone", event.target.value)} /></label>
        <label>Email<Input type="email" value={values.email ?? ""} onChange={(event) => update("email", event.target.value || null)} /></label>
        <label>Giới tính<select className="h-10 rounded-md border bg-background px-3 text-sm" value={values.gender} onChange={(event) => update("gender", Number(event.target.value) as GuardianRequest["gender"])}><option value={0}>{GENDER_LABELS[0]}</option><option value={1}>{GENDER_LABELS[1]}</option><option value={2}>{GENDER_LABELS[2]}</option></select></label>
        <label>Địa chỉ<Textarea value={values.address ?? ""} onChange={(event) => update("address", event.target.value || null)} /></label>
        <label>Ghi chú<Textarea value={values.note ?? ""} onChange={(event) => update("note", event.target.value || null)} /></label>
      </div>
      <fieldset className="grid gap-2 rounded-lg border bg-card p-5">
        <legend className="font-semibold">Học sinh liên kết</legend>
        {students.map((student) => {
          const link = values.students.find((candidate) => candidate.student_profile_id === student.id);
          const currentGuardian = guardianId === undefined
            ? undefined
            : student.guardians.find((candidate) => candidate.profile_id === guardianId);
          const replacementChoices = guardianId === undefined
            ? []
            : guardianReplacementChoices(student, guardianId);
          const replacementRequired = currentGuardian?.is_primary === true
            && (link === undefined || !link.is_primary)
            && replacementChoices.length > 0;

          return (
            <div key={student.id} className="grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={link !== undefined} onChange={() => toggleStudent(student.id)} />
                <span className="min-w-0 flex-1">{student.full_name}</span>
                {link ? <>
                  <select aria-label={`Quan hệ với ${student.full_name}`} value={link.relationship} onChange={(event) => updateStudent(student.id, { relationship: Number(event.target.value) as GuardianRelationship })}>
                    <option value={0}>Cha</option><option value={1}>Mẹ</option><option value={2}>Người giám hộ</option>
                  </select>
                  <label className="flex items-center gap-1"><input aria-label={`Liên hệ chính của ${student.full_name}`} type="checkbox" checked={link.is_primary} onChange={(event) => updateStudent(student.id, { is_primary: event.target.checked })} /> Chính</label>
                </> : null}
              </label>
              {replacementRequired ? (
                <label className="ml-6 grid gap-1 text-sm">
                  Người thay thế cho {student.full_name}
                  <select
                    required
                    value={values.replacements?.[student.id] ?? ""}
                    onChange={(event) => onChange({
                      ...values,
                      replacements: { ...values.replacements, [student.id]: Number(event.target.value) },
                    })}
                  >
                    <option value="">Chọn hồ sơ đã liên kết</option>
                    {replacementChoices.map((candidate) => (
                      <option key={candidate.profile_id} value={candidate.profile_id}>{candidate.full_name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          );
        })}
        {students.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có học sinh để liên kết.</p> : null}
      </fieldset>
      <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button><Button type="submit" disabled={pending || values.students.length === 0 || !replacementReady}>Lưu hồ sơ</Button></div>
    </form>
  );
}
