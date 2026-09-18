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
import {
  SUBJECT_LIST_SORT_LABELS,
  type SubjectFilterState,
  type SubjectListSort,
  type SubjectListView,
} from "../utils/subject-list-controls";

const SORT_OPTIONS: SortOption<SubjectListSort>[] = [
  { value: "name-asc", label: SUBJECT_LIST_SORT_LABELS["name-asc"], icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
  { value: "name-desc", label: SUBJECT_LIST_SORT_LABELS["name-desc"], icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
  { value: "classes-asc", label: SUBJECT_LIST_SORT_LABELS["classes-asc"], icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "classes-desc", label: SUBJECT_LIST_SORT_LABELS["classes-desc"], icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "newest", label: SUBJECT_LIST_SORT_LABELS.newest, icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
];

/** Renders the Search, Filter, Sort, and View controls for subjects. */
export function SubjectListToolbar({
  search,
  onSearchChange,
  filters,
  filterCount,
  sort,
  view,
  onGradeLevelChange,
  onActiveChange,
  onClearFilters,
  onSortChange,
  onViewChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters: SubjectFilterState;
  filterCount: number;
  sort: SubjectListSort;
  view: SubjectListView;
  onGradeLevelChange: (gradeLevel: GradeLevel | null) => void;
  onActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: SubjectListSort) => void;
  onViewChange: (view: SubjectListView) => void;
}) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm tên môn học…"
      searchAriaLabel="Tìm kiếm môn học"
      searchHelpText="Tìm theo tên môn học. Bỏ dấu tiếng Việt vẫn tìm được."
      align="start"
      size="control"
    >
      <FilterPopover
        compact
        count={filterCount}
        onClear={onClearFilters}
        note="Thay đổi được áp dụng ngay."
      >
        <FilterSection label="Khối áp dụng">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={filters.gradeLevel === null}
              onClick={() => onGradeLevelChange(null)}
              className="h-7 rounded-control border px-2 text-[11px] font-medium transition-colors hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep"
            >
              Tất cả
            </button>
            {GRADE_LEVELS.map((gradeLevel) => (
              <button
                key={gradeLevel}
                type="button"
                aria-pressed={filters.gradeLevel === gradeLevel}
                onClick={() => onGradeLevelChange(gradeLevel)}
                className="h-7 rounded-control border px-2 text-[11px] font-medium transition-colors hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep"
              >
                {formatGradeLevel(gradeLevel)}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Trạng thái" last>
          <div className="grid grid-cols-3 overflow-hidden rounded-control border">
            {([
              [null, "Tất cả"],
              [true, "Hoạt động"],
              [false, "Ngừng hoạt động"],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={filters.isActive === value}
                onClick={() => onActiveChange(value)}
                className="h-8 border-r text-[11px] last:border-r-0 hover:bg-orange-50 aria-pressed:bg-orange-50 aria-pressed:font-medium aria-pressed:text-vc-orange-deep"
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
        note="Dạng thẻ phù hợp khi xem trên màn hình hẹp."
      />
    </ListToolbar>
  );
}

/** Reports whether a keyword, filter, or non-default ordering is applied. */
export function hasSubjectConditions({
  search,
  filterCount,
  sort,
}: {
  search: string;
  filterCount: number;
  sort: SubjectListSort;
}): boolean {
  return search !== "" || filterCount > 0 || sort !== "newest";
}

/** Renders every applied subject condition as a removable chip. */
export function SubjectConditionsBar({
  search,
  filters,
  sort,
  onSearchChange,
  onGradeLevelChange,
  onActiveChange,
  onSortChange,
  onClearConditions,
}: {
  search: string;
  filters: SubjectFilterState;
  sort: SubjectListSort;
  onSearchChange: (value: string) => void;
  onGradeLevelChange: (gradeLevel: GradeLevel | null) => void;
  onActiveChange: (isActive: boolean | null) => void;
  onSortChange: (sort: SubjectListSort) => void;
  onClearConditions: () => void;
}) {
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

      {filters.gradeLevel !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Khối áp dụng"
          label={formatGradeLevel(filters.gradeLevel)}
          onRemove={() => onGradeLevelChange(null)}
        />
      ) : null}

      {filters.isActive !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Trạng thái"
          label={filters.isActive ? "Hoạt động" : "Ngừng hoạt động"}
          onRemove={() => onActiveChange(null)}
        />
      ) : null}

      {sort !== "newest" ? (
        <ConditionTag
          tone="neutral"
          caption="Sắp xếp"
          label={SUBJECT_LIST_SORT_LABELS[sort]}
          onRemove={() => onSortChange("newest")}
        />
      ) : null}
    </ConditionsBar>
  );
}

function formatGradeLevel(gradeLevel: GradeLevel): string {
  return gradeLevel === 0 ? "Tiền TH" : `Khối ${gradeLevel}`;
}
