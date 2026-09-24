import type { GuardianListRequest } from "../types/academic-requests";
import type { GuardianStudentRequest, GuardianRequest } from "../types/academic-requests";
import type { Guardian, Student, StudentGuardianSummary } from "../types/academic";
import type { UserRole } from "@/modules/auth";
import { GENDER_LABELS, GRADE_LEVEL_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from "./labels";

/** Deny Teacher mutations regardless of grants while preserving feature-based Admin access. */
export function guardianCanMutate(role: UserRole | undefined, hasFeature: boolean): boolean {
  return role !== 1 && hasFeature;
}

/** Maximum number accepted by the shared guardian option request contract. */
export const GUARDIAN_OPTION_LIMIT = 50;

/** Sort modes exposed by the guardian directory. */
export type GuardianListSort = "newest" | "date-asc" | "name-asc" | "name-desc";

/** The two ways the guardian directory can be read. */
export type GuardianListView = "table" | "grid";

/** Labels shown by the guardian sort menu and active-condition chip. */
export const GUARDIAN_LIST_SORT_LABELS: Record<GuardianListSort, string> = {
  newest: "Mới thêm",
  "date-asc": "Cũ nhất",
  "name-asc": "Tên A–Z",
  "name-desc": "Tên Z–A",
};

/** Converts visible guardian controls to the explicit API query contract. */
export function buildGuardianListParams(controls: {
  q?: string;
  page?: number;
  perPage?: number;
  sort?: GuardianListSort;
}): GuardianListRequest {
  const sort = controls.sort ?? "newest";
  const ordering = {
    newest: { sort: "created_at", direction: "desc" },
    "date-asc": { sort: "created_at", direction: "asc" },
    "name-asc": { sort: "full_name", direction: "asc" },
    "name-desc": { sort: "full_name", direction: "desc" },
  } as const;

  return {
    ...(controls.q?.trim() ? { q: controls.q.trim() } : {}),
    ...(controls.page === undefined ? {} : { page: controls.page }),
    ...(controls.perPage === undefined ? {} : { per_page: controls.perPage }),
    ...ordering[sort],
  };
}

/** Return every linked student id so replacement data is never limited to a paged list. */
export function buildGuardianStudentFetchPlan(studentIds: readonly number[]): number[] {
  return [...new Set(studentIds)];
}

/** Check that every affected primary link has a loaded, valid replacement selection. */
export function guardianReplacementRequirementsMet(
  guardianId: number,
  linkedStudentIds: readonly number[],
  students: Pick<Student, "id" | "guardians">[],
  roster: GuardianRequest["students"],
  replacements: Record<number, number> = {},
): boolean {
  if (students.length !== linkedStudentIds.length || !linkedStudentIds.every((id) => students.some((student) => student.id === id))) return false;

  return students.every((student) => {
    const current = student.guardians.find((guardian) => guardian.profile_id === guardianId);
    const row = roster.find((entry) => entry.student_profile_id === student.id);
    if (!current?.is_primary || row?.is_primary === true) return true;

    const candidates = student.guardians.filter((guardian) => guardian.profile_id !== guardianId);
    if (candidates.length === 0) return true;
    return candidates.some((candidate) => candidate.profile_id === replacements[student.id]);
  });
}

/** Check that deletion has a valid replacement for every affected primary student. */
export function guardianDeleteRequirementsMet(
  guardianId: number,
  linkedStudentIds: readonly number[],
  students: Pick<Student, "id" | "guardians">[],
  replacements: Record<number, number> = {},
): boolean {
  if (students.length !== linkedStudentIds.length || !linkedStudentIds.every((id) => students.some((student) => student.id === id))) return false;

  return students.every((student) => {
    const current = student.guardians.find((guardian) => guardian.profile_id === guardianId);
    const candidates = student.guardians.filter((guardian) => guardian.profile_id !== guardianId);
    if (!current?.is_primary || candidates.length === 0) return true;
    return candidates.some((candidate) => candidate.profile_id === replacements[student.id]);
  });
}

/** Format the contact facts shown on the guardian detail view. */
export function guardianDetailProfileFacts(
  guardian: Pick<Guardian, "phone" | "email" | "gender" | "address" | "note">,
): Array<{ label: string; value: string }> {
  return [
    { label: "Số điện thoại", value: guardian.phone },
    { label: "Email", value: guardian.email ?? "—" },
    { label: "Giới tính", value: GENDER_LABELS[guardian.gender] },
    { label: "Địa chỉ", value: guardian.address ?? "—" },
    { label: "Ghi chú", value: guardian.note ?? "—" },
  ];
}

/** Format one linked student for the guardian detail roster. */
export function guardianDetailStudentLabel(student: Pick<Guardian["students"][number], "grade_level" | "relationship">): string {
  return `${GRADE_LEVEL_LABELS[student.grade_level]} · ${GUARDIAN_RELATIONSHIP_LABELS[student.relationship]}`;
}

/** Update one roster row without changing another student's primary flag. */
export function toggleGuardianStudent(
  roster: GuardianStudentRequest[],
  studentProfileId: number,
  changes: Partial<Pick<GuardianStudentRequest, "relationship" | "is_primary">>,
): GuardianStudentRequest[] {
  return roster.map((row) =>
    row.student_profile_id === studentProfileId ? { ...row, ...changes } : row,
  );
}

/** Return only guardians linked to the affected student, excluding the removed profile. */
export function guardianReplacementChoices(
  student: Student,
  removedGuardianId: number,
): StudentGuardianSummary[] {
  return student.guardians.filter((guardian) => guardian.profile_id !== removedGuardianId);
}

/** Keep only explicit replacements relevant to removed or demoted roster rows. */
export function buildGuardianUpdatePayload(values: GuardianRequest): GuardianRequest {
  const activeRows = new Map(values.students.map((student) => [student.student_profile_id, student]));
  const replacements = Object.fromEntries(
    Object.entries(values.replacements ?? {}).filter(([studentId]) => {
      const row = activeRows.get(Number(studentId));
      return row === undefined || row.is_primary === false;
    }),
  );

  return {
    ...values,
    ...(Object.keys(replacements).length > 0 ? { replacements } : { replacements: undefined }),
  };
}

/** Reset search and paging while retaining a deterministic default sort. */
export function resetGuardianListControls(_current: {
  q?: string;
  page?: number;
  sort?: GuardianListSort;
}): { q: string; page: number; sort: GuardianListSort } {
  void _current;
  return { q: "", page: 1, sort: "newest" };
}
