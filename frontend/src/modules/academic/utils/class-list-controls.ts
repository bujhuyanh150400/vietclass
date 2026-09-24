import type { ClassStatus, GradeLevel } from "../types/academic";
import type { ClassListRequest } from "../types/academic-requests";

/** Sort choices shared by the class-list URL state and its visible controls. */
export type ClassListSort = "created-desc" | "name-asc" | "name-desc" | "start-near";

/** Layout choices shared by the class-list URL state and its visible controls. */
export type ClassListView = "table" | "grid";

/** Valid class-list sort values accepted from the URL. */
export const CLASS_LIST_SORTS: ClassListSort[] = [
  "created-desc",
  "name-asc",
  "name-desc",
  "start-near",
];

/** Valid class-list layouts accepted from the URL. */
export const CLASS_LIST_VIEWS: ClassListView[] = ["table", "grid"];

/** Page sizes available while the class list is shown as a table. */
export const CLASS_TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

/** Filters and server-side sorting used to request one page of classes. */
export function buildClassListParams({
  status,
  gradeLevel,
  sort,
}: {
  status: ClassStatus | null;
  gradeLevel: GradeLevel | null;
  sort: ClassListSort;
}): Partial<ClassListRequest> {
  const sortParams = {
    "created-desc": { sort: "created_at", direction: "desc" },
    "name-asc": { sort: "name", direction: "asc" },
    "name-desc": { sort: "name", direction: "desc" },
    "start-near": { sort: "start_at", direction: "desc" },
  } satisfies Record<
    ClassListSort,
    { sort: NonNullable<ClassListRequest["sort"]>; direction: "asc" | "desc" }
  >;

  return {
    ...(status === null ? {} : { "status[0]": status }),
    ...(gradeLevel === null ? {} : { "grade_level[0]": gradeLevel }),
    ...sortParams[sort],
  };
}

/** Counts the status and grade filter groups shown in the Filter trigger. */
export function activeClassFilterCount(
  status: ClassStatus | null,
  gradeLevel: GradeLevel | null,
): number {
  return Number(status !== null) + Number(gradeLevel !== null);
}

/** Reports whether a visible search, filter, or non-default sort can be cleared. */
export function hasClassConditions({
  search,
  status,
  gradeLevel,
  sort,
}: {
  search: string;
  status: ClassStatus | null;
  gradeLevel: GradeLevel | null;
  sort: ClassListSort;
}): boolean {
  return search !== "" || status !== null || gradeLevel !== null || sort !== "created-desc";
}

/** Cards always request twenty rows; invalid table page sizes fall back to ten. */
export function resolveClassPageSize(
  view: ClassListView,
  requestedPageSize: number,
): (typeof CLASS_TABLE_PAGE_SIZES)[number] {
  if (view === "grid") return 20;

  return CLASS_TABLE_PAGE_SIZES.includes(
    requestedPageSize as (typeof CLASS_TABLE_PAGE_SIZES)[number],
  )
    ? requestedPageSize as (typeof CLASS_TABLE_PAGE_SIZES)[number]
    : 10;
}
