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
import { Checkbox } from "@/components/ui/checkbox";

import type { GradeLevel, StudentStatus } from "../types/academic";
import { GRADE_LEVELS, GRADE_LEVEL_LABELS, STUDENT_STATUS_LABELS } from "../utils/labels";
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

/** Every study status shown in the student filter. */
const STUDENT_STATUSES: StudentStatus[] = [0, 1, 2];

/** Props required by the student collection toolbar. */
type StudentListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: StudentFilterState;
  filterCount: number;
  sort: StudentListSort;
  view: StudentListView;
  onToggleGradeLevel: (gradeLevel: GradeLevel) => void;
  onToggleStatus: (status: StudentStatus) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: StudentListSort) => void;
  onViewChange: (view: StudentListView) => void;
  onClearConditions: () => void;
};

/** Renders the compact Search, Filter, Sort, View controls and applied tags. */
export function StudentListToolbar({
  search,
  onSearchChange,
  filters,
  filterCount,
  sort,
  view,
  onToggleGradeLevel,
  onToggleStatus,
  onAccountActiveChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onClearConditions,
}: StudentListToolbarProps) {
  const hasConditions = search !== "" || filterCount > 0 || sort !== "newest";

  return (
    <div className="grid gap-2.5">
      <ListToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Tìm kiếm học sinh"
        searchAriaLabel="Tìm kiếm học sinh"
        searchHelpText="Tìm theo tên hoặc số điện thoại học sinh, tên hoặc số điện thoại phụ huynh, và tên đăng nhập."
      >
        <FilterPopover
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
                    className="h-7 rounded-md border px-2 text-[11px] font-medium transition-colors hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep"
                  >
                    {gradeLevel === 0 ? "Tiền TH" : `Khối ${gradeLevel}`}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection label="Trạng thái học tập">
            <div className="grid grid-cols-3 gap-2">
              {STUDENT_STATUSES.map((status) => (
                <label key={status} className="flex cursor-pointer items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() => onToggleStatus(status)}
                    className="data-[state=checked]:border-vc-orange data-[state=checked]:bg-vc-orange data-[state=checked]:text-white"
                  />
                  {STUDENT_STATUS_LABELS[status]}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Tài khoản" last>
            <div className="grid grid-cols-3 overflow-hidden rounded-md border">
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
          value={sort}
          options={SORT_OPTIONS}
          onChange={onSortChange}
          isActive={sort !== "newest"}
        />

        <ViewPopover
          value={view}
          onChange={onViewChange}
          note="Dạng thẻ luôn hiển thị 20 mục mỗi trang."
        />
      </ListToolbar>

      {hasConditions ? (
        <ConditionsBar onClearAll={onClearConditions}>
          {search ? (
            <ConditionTag
              tone="keyword"
              label={`Từ khóa: ${search}`}
              onRemove={() => onSearchChange("")}
            />
          ) : null}
          {filters.gradeLevels.map((gradeLevel) => (
            <ConditionTag
              key={`grade-${gradeLevel}`}
              tone="filter"
              label={`Khối: ${GRADE_LEVEL_LABELS[gradeLevel].replace("Lớp ", "")}`}
              onRemove={() => onToggleGradeLevel(gradeLevel)}
            />
          ))}
          {filters.statuses.map((status) => (
            <ConditionTag
              key={`status-${status}`}
              tone="filter"
              label={`Trạng thái: ${STUDENT_STATUS_LABELS[status]}`}
              onRemove={() => onToggleStatus(status)}
            />
          ))}
          {filters.isActive !== null ? (
            <ConditionTag
              tone="filter"
              label={`Tài khoản: ${filters.isActive ? "Đang mở" : "Đã khóa"}`}
              onRemove={() => onAccountActiveChange(null)}
            />
          ) : null}
          {sort !== "newest" ? (
            <ConditionTag
              tone="sort"
              label={SORT_LABELS[sort]}
              icon={<ArrowUpDown aria-hidden="true" />}
              onRemove={() => onSortChange("newest")}
            />
          ) : null}
        </ConditionsBar>
      ) : null}
    </div>
  );
}
