"use client";

import { ArrowDownAZ, ArrowDownZA, ArrowUpDown } from "lucide-react";

import {
  ConditionTag,
  ConditionsBar,
  FilterPopover,
  FilterSection,
  ListToolbar,
  SortPopover,
  ViewPopover,
  type SortOption,
} from "@/components/shared/data-table";

import type { GradeLevel } from "../types/academic";
import { GRADE_LEVELS } from "../utils/labels";
import type {
  StudentFilterState,
  StudentListSort,
  StudentListView,
} from "../utils/student-list-controls";

/** Visible labels for each supported student sort, in menu order. */
const SORT_OPTIONS: SortOption<StudentListSort>[] = [
  { value: "name-asc", label: "Tên A–Z", icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
  { value: "name-desc", label: "Tên Z–A", icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
  { value: "grade-asc", label: "Khối tăng dần", icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "newest", label: "Mới tạo gần đây", icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
];

const SORT_LABELS: Record<StudentListSort, string> = Object.fromEntries(
  SORT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<StudentListSort, string>;

/**
 * Every control the student list screen owns.
 *
 * One type for both the toolbar and the conditions bar: the two render the same
 * controls from opposite ends — one applies a condition, the other removes it —
 * so a control added to one and not the other would be a control a reader can
 * set but not clear.
 */
type StudentListControls = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: StudentFilterState;
  filterCount: number;
  sort: StudentListSort;
  view: StudentListView;
  onToggleGradeLevel: (gradeLevel: GradeLevel) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: StudentListSort) => void;
  onViewChange: (view: StudentListView) => void;
  onClearConditions: () => void;
};

/** Renders the Search, Filter, Sort, and View row printed along the sheet's top edge. */
export function StudentListToolbar({
  search,
  onSearchChange,
  filters,
  filterCount,
  sort,
  view,
  onToggleGradeLevel,
  onAccountActiveChange,
  onClearFilters,
  onSortChange,
  onViewChange,
}: Omit<StudentListControls, "onClearConditions">) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm tên, số điện thoại, phụ huynh…"
      searchAriaLabel="Tìm kiếm học sinh"
      searchHelpText="Tìm theo tên hoặc số điện thoại học sinh, tên hoặc số điện thoại phụ huynh, và tên đăng nhập."
      align="start"
      size="control"
      searchClassName="w-full min-w-0 sm:w-[min(420px,42vw)] sm:min-w-[260px]"
    >
      <FilterPopover
        compact
        count={filterCount}
        onClear={onClearFilters}
        note="Thay đổi được áp dụng ngay."
      >
        <FilterSection label="Khối">
          <div className="flex flex-wrap gap-1.5">
            {GRADE_LEVELS.map((gradeLevel) => {
              const selected = filters.gradeLevels.includes(gradeLevel);

              return (
                <button
                  key={gradeLevel}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleGradeLevel(gradeLevel)}
                  className="h-7 rounded-control border px-2 text-[11px] font-medium transition-colors hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep"
                >
                  {gradeLevel === 0 ? "Tiền TH" : `Khối ${gradeLevel}`}
                </button>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection label="Tài khoản" last>
          <div className="grid grid-cols-3 overflow-hidden rounded-control border">
            {([
              [null, "Tất cả"],
              [true, "Đang mở"],
              [false, "Đã khóa"],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={filters.isActive === value}
                onClick={() => onAccountActiveChange(value)}
                className="h-8 border-r text-xs last:border-r-0 hover:bg-orange-50 aria-pressed:bg-orange-50 aria-pressed:font-medium aria-pressed:text-vc-orange-deep"
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>
      </FilterPopover>

      <SortPopover
        compact
        value={sort}
        options={SORT_OPTIONS}
        onChange={onSortChange}
        isActive={sort !== "newest"}
      />

      <ViewPopover
        compact
        value={view}
        onChange={onViewChange}
        note="Dạng thẻ luôn hiển thị 20 mục mỗi trang."
      />
    </ListToolbar>
  );
}

/**
 * Reports whether anything is currently narrowing the collection, so the sheet
 * knows whether to print a conditions bar at all.
 */
export function hasStudentConditions({
  search,
  filterCount,
  sort,
}: {
  search: string;
  filterCount: number;
  sort: StudentListSort;
}): boolean {
  return search !== "" || filterCount > 0 || sort !== "newest";
}

/**
 * Renders every applied condition as a removable chip.
 *
 * Each chip is captioned with the control that produced it, because a bar
 * holding "9" and "Đang mở" side by side otherwise relies on the reader
 * remembering which filter they touched.
 *
 * Sort appears here too: it is not a filter, but it changes which students land
 * on the page being read, so leaving it out would make the first page look
 * arbitrary.
 */
export function StudentConditionsBar({
  search,
  filters,
  sort,
  onSearchChange,
  onToggleGradeLevel,
  onAccountActiveChange,
  onSortChange,
  onClearConditions,
}: Pick<
  StudentListControls,
  | "search"
  | "filters"
  | "sort"
  | "onSearchChange"
  | "onToggleGradeLevel"
  | "onAccountActiveChange"
  | "onSortChange"
  | "onClearConditions"
>) {
  return (
    <ConditionsBar heading="Đang áp dụng" align="start" onClearAll={onClearConditions}>
      {search ? (
        <ConditionTag
          tone="neutral"
          caption="Từ khóa"
          label={`“${search}”`}
          onRemove={() => onSearchChange("")}
        />
      ) : null}

      {filters.gradeLevels.map((gradeLevel) => (
        <ConditionTag
          key={`grade-${gradeLevel}`}
          tone="neutral"
          caption="Khối"
          label={gradeLevel === 0 ? "Tiền TH" : String(gradeLevel)}
          onRemove={() => onToggleGradeLevel(gradeLevel)}
        />
      ))}

      {filters.isActive !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Tài khoản"
          label={filters.isActive ? "Đang mở" : "Đã khóa"}
          onRemove={() => onAccountActiveChange(null)}
        />
      ) : null}

      {sort !== "newest" ? (
        <ConditionTag
          tone="neutral"
          caption="Sắp xếp"
          label={SORT_LABELS[sort]}
          onRemove={() => onSortChange("newest")}
        />
      ) : null}
    </ConditionsBar>
  );
}
