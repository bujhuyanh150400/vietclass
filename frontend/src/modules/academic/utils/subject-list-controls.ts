import type { SubjectListParams } from "../api/subjects-api";
import type { GradeLevel } from "../types/academic";

/** Sort modes exposed by the subject catalogue. */
export type SubjectListSort = "newest" | "name-asc" | "name-desc" | "classes-desc";

/** Values shared by URL parsing and the sort picker. */
export const SUBJECT_LIST_SORTS: SubjectListSort[] = ["newest", "name-asc", "name-desc", "classes-desc"];

/** Page densities appropriate for the compact catalogue table. */
export const SUBJECT_TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

/** Filters which narrow the catalogue independently of its keyword. */
export type SubjectFilterState = { gradeLevel: GradeLevel | null; isActive: boolean | null };

/** Converts visible controls to the backend query contract. */
export function buildSubjectListParams(
  controls: SubjectFilterState & { sort: SubjectListSort },
): Partial<SubjectListParams> {
  const ordering = {
    newest: { sort: "created_at", direction: "desc" },
    "name-asc": { sort: "name", direction: "asc" },
    "name-desc": { sort: "name", direction: "desc" },
    "classes-desc": { sort: "active_classes_count", direction: "desc" },
  } satisfies Record<SubjectListSort, { sort: NonNullable<SubjectListParams["sort"]>; direction: "asc" | "desc" }>;

  return {
    ...(controls.gradeLevel === null ? {} : { grade_level: controls.gradeLevel }),
    ...(controls.isActive === null ? {} : { is_active: controls.isActive ? 1 : 0 }),
    ...ordering[controls.sort],
  };
}

/** Counts applied filter groups for the compact filter affordance. */
export function activeSubjectFilterCount(filters: SubjectFilterState): number {
  return Number(filters.gradeLevel !== null) + Number(filters.isActive !== null);
}
