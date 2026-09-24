import type { TeacherListRequest } from "../types/academic-requests";

/** Sort modes exposed by the teacher directory. */
export type TeacherListSort = "newest" | "date-asc" | "name-asc" | "name-desc";

/** Values shared by URL parsing and the sort picker. */
export const TEACHER_LIST_SORTS: TeacherListSort[] = [
  "newest",
  "date-asc",
  "name-asc",
  "name-desc",
];

/** Vietnamese wording shared by the sort picker and applied-condition chip. */
export const TEACHER_LIST_SORT_LABELS: Record<TeacherListSort, string> = {
  newest: "Tham gia mới nhất",
  "date-asc": "Tham gia cũ nhất",
  "name-asc": "Họ tên A → Z",
  "name-desc": "Họ tên Z → A",
};

/** The two ways the directory can be read. */
export type TeacherListView = "table" | "grid";

/** Values shared by URL parsing and the view picker. */
export const TEACHER_LIST_VIEWS: TeacherListView[] = ["table", "grid"];

/** Page densities offered by the prototype's teacher directory. */
export const TEACHER_TABLE_PAGE_SIZES = [10, 20, 50, 100, 200] as const;

/** Filters which narrow the directory independently of its keyword. */
export type TeacherFilterState = {
  subjectId: number | null;
  classId: number | null;
  isActive: boolean | null;
  joinedFrom: string;
  joinedTo: string;
};

/** Converts visible controls to the teacher list's explicit API contract. */
export function buildTeacherListParams(
  filters: TeacherFilterState & { sort: TeacherListSort },
): Partial<TeacherListRequest> {
  const ordering = {
    newest: { sort: "joined_at", direction: "desc" },
    "date-asc": { sort: "joined_at", direction: "asc" },
    "name-asc": { sort: "full_name", direction: "asc" },
    "name-desc": { sort: "full_name", direction: "desc" },
  } satisfies Record<
    TeacherListSort,
    { sort: NonNullable<TeacherListRequest["sort"]>; direction: "asc" | "desc" }
  >;

  return {
    ...(filters.subjectId === null ? {} : { subject_id: [filters.subjectId] }),
    ...(filters.classId === null ? {} : { class_id: [filters.classId] }),
    ...(filters.isActive === null ? {} : { is_active: filters.isActive ? 1 : 0 }),
    ...(filters.joinedFrom === "" ? {} : { joined_from: filters.joinedFrom }),
    ...(filters.joinedTo === "" ? {} : { joined_to: filters.joinedTo }),
    ...ordering[filters.sort],
  };
}

/** Counts active filter values for the compact toolbar badge. */
export function activeTeacherFilterCount(filters: TeacherFilterState): number {
  return (
    Number(filters.subjectId !== null) +
    Number(filters.classId !== null) +
    Number(filters.isActive !== null) +
    Number(filters.joinedFrom !== "") +
    Number(filters.joinedTo !== "")
  );
}
