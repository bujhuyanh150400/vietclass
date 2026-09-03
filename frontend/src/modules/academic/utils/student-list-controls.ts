import type { GradeLevel, StudentStatus } from "../types/academic";
import type { StudentListParams } from "../api/students-api";

/** The display modes the student list can switch between. */
export type StudentListView = "table" | "grid";

/** The sort choices exposed by the student list. */
export type StudentListSort =
  | "name-asc"
  | "name-desc"
  | "grade-asc"
  | "newest";

/** Every student sort choice, shared by URL parsing and visible controls. */
export const STUDENT_LIST_SORTS: StudentListSort[] = [
  "name-asc",
  "name-desc",
  "grade-asc",
  "newest",
];

/** Every supported student collection layout. */
export const STUDENT_LIST_VIEWS: StudentListView[] = ["table", "grid"];

/** The filters the student endpoint accepts. */
export type StudentFilterState = {
  gradeLevels: GradeLevel[];
  statuses: StudentStatus[];
  isActive: boolean | null;
};

/** Every non-paging control that changes the student collection. */
export type StudentListControlState = StudentFilterState & {
  sort: StudentListSort;
};

/** The page sizes a table reader may choose. */
export const STUDENT_TABLE_PAGE_SIZES = [20, 50, 100, 200] as const;

/** Converts student controls into the Laravel list endpoint's query contract. */
export function buildStudentListParams(
  controls: StudentListControlState,
): Partial<StudentListParams> {
  const params: Partial<StudentListParams> = {};

  controls.gradeLevels.forEach((gradeLevel, index) => {
    params[`grade_level[${index}]`] = gradeLevel;
  });

  controls.statuses.forEach((status, index) => {
    params[`status[${index}]`] = status;
  });

  if (controls.isActive !== null) {
    params.is_active = controls.isActive ? 1 : 0;
  }

  const sort = {
    "name-asc": { sort: "full_name", direction: "asc" },
    "name-desc": { sort: "full_name", direction: "desc" },
    "grade-asc": { sort: "grade_level", direction: "asc" },
    newest: { sort: "created_at", direction: "desc" },
  } satisfies Record<
    StudentListSort,
    { sort: NonNullable<StudentListParams["sort"]>; direction: "asc" | "desc" }
  >;

  return { ...params, ...sort[controls.sort] };
}

/** Counts active filter groups so the Filter button reports useful scope. */
export function activeStudentFilterCount(filters: StudentFilterState): number {
  return Number(filters.gradeLevels.length > 0)
    + Number(filters.statuses.length > 0)
    + Number(filters.isActive !== null);
}

/** Keeps table limits valid and enforces the grid's fixed twenty-card page. */
export function resolveStudentPageSize(
  view: StudentListView,
  requestedPageSize: number,
): (typeof STUDENT_TABLE_PAGE_SIZES)[number] {
  if (view === "grid") {
    return 20;
  }

  return STUDENT_TABLE_PAGE_SIZES.includes(
    requestedPageSize as (typeof STUDENT_TABLE_PAGE_SIZES)[number],
  )
    ? requestedPageSize as (typeof STUDENT_TABLE_PAGE_SIZES)[number]
    : 20;
}
