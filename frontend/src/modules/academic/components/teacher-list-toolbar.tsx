"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, CheckIcon, ChevronsUpDownIcon } from "lucide-react";

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
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils/index";

import { useClassOptions } from "../hooks/use-classes";
import { useSubjectOptions } from "../hooks/use-subjects";
import type { Option } from "../types/academic";
import {
  TEACHER_LIST_SORT_LABELS,
  type TeacherFilterState,
  type TeacherListSort,
  type TeacherListView,
} from "../utils/teacher-list-controls";
import { formatDate } from "../utils/labels";

const SORT_OPTIONS: SortOption<TeacherListSort>[] = [
  {
    value: "newest",
    label: TEACHER_LIST_SORT_LABELS.newest,
    icon: <ArrowUpDown aria-hidden="true" className="size-3.5" />,
  },
  {
    value: "date-asc",
    label: TEACHER_LIST_SORT_LABELS["date-asc"],
    icon: <ArrowUpDown aria-hidden="true" className="size-3.5" />,
  },
  {
    value: "name-asc",
    label: TEACHER_LIST_SORT_LABELS["name-asc"],
    icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" />,
  },
  {
    value: "name-desc",
    label: TEACHER_LIST_SORT_LABELS["name-desc"],
    icon: <ArrowDownZA aria-hidden="true" className="size-3.5" />,
  },
];

/** Renders the search, filters, sort, and view controls for teachers. */
export function TeacherListToolbar({
  search,
  onSearchChange,
  filters,
  filterCount,
  sort,
  view,
  subjectOptions,
  classOptions,
  onSubjectChange,
  onClassChange,
  onAccountActiveChange,
  onJoinedFromChange,
  onJoinedToChange,
  onClearFilters,
  onSortChange,
  onViewChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters: TeacherFilterState;
  filterCount: number;
  sort: TeacherListSort;
  view: TeacherListView;
  subjectOptions: Option[];
  classOptions: Option[];
  onSubjectChange: (subjectId: number | null) => void;
  onClassChange: (classId: number | null) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onJoinedFromChange: (value: string) => void;
  onJoinedToChange: (value: string) => void;
  onClearFilters: () => void;
  onSortChange: (sort: TeacherListSort) => void;
  onViewChange: (view: TeacherListView) => void;
}) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tên, số điện thoại, email hoặc lớp…"
      searchAriaLabel="Tìm kiếm giáo viên"
      searchHelpText="Tìm theo tên, số điện thoại, email, tài khoản, mã lớp hoặc môn học. Bỏ dấu tiếng Việt vẫn tìm được."
      align="start"
      size="control"
    >
      <FilterPopover
        compact
        count={filterCount}
        onClear={onClearFilters}
        note="Thay đổi được áp dụng ngay."
      >
        <FilterSection label="Bộ môn">
          <SearchableFilterSelect
            value={filters.subjectId}
            options={subjectOptions}
            useOptions={useSubjectOptions}
            placeholder="Tất cả bộ môn"
            searchPlaceholder="Tìm bộ môn…"
            emptyMessage="Không tìm thấy bộ môn."
            ariaLabel="Chọn bộ môn"
            onChange={onSubjectChange}
          />
        </FilterSection>

        <FilterSection label="Lớp phụ trách">
          <SearchableFilterSelect
            value={filters.classId}
            options={classOptions}
            useOptions={useClassOptions}
            placeholder="Tất cả lớp"
            searchPlaceholder="Tìm lớp phụ trách…"
            emptyMessage="Không tìm thấy lớp."
            ariaLabel="Chọn lớp phụ trách"
            onChange={onClassChange}
          />
        </FilterSection>

        <FilterSection label="Tài khoản">
          <div className="grid grid-cols-3 overflow-hidden rounded-control border">
            {([
              [null, "Tất cả"],
              [true, "Đang hoạt động"],
              [false, "Đã khóa"],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={filters.isActive === value}
                onClick={() => onAccountActiveChange(value)}
                className="h-8 border-r text-[11px] last:border-r-0 hover:bg-orange-50 aria-pressed:bg-orange-50 aria-pressed:font-medium aria-pressed:text-vc-orange-deep"
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Ngày tham gia" last>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[10px] text-muted-foreground">
              Từ ngày
              <Input
                type="date"
                value={filters.joinedFrom}
                onChange={(event) => onJoinedFromChange(event.target.value)}
                className="h-9 rounded-control text-xs"
              />
            </label>
            <label className="grid gap-1 text-[10px] text-muted-foreground">
              Đến ngày
              <Input
                type="date"
                value={filters.joinedTo}
                onChange={(event) => onJoinedToChange(event.target.value)}
                className="h-9 rounded-control text-xs"
              />
            </label>
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

type OptionLoader = (search: string) => UseQueryResult<Option[]>;

/** Renders a filter combobox that searches option endpoints as the user types. */
function SearchableFilterSelect({
  value,
  options,
  useOptions,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  ariaLabel,
  onChange,
}: {
  value: number | null;
  options: Option[];
  useOptions: OptionLoader;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  ariaLabel: string;
  onChange: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [knownLabels, setKnownLabels] = useState<Record<number, string>>({});
  const debouncedSearch = useDebouncedValue(search);
  const query = useOptions(debouncedSearch);
  const availableOptions = query.data ?? options;
  const selectedOption = availableOptions.find((option) => option.id === value);
  const fallbackOption = options.find((option) => option.id === value);
  const selectedLabel = selectedOption?.label ?? fallbackOption?.label ?? (value === null ? placeholder : knownLabels[value] ?? `#${value}`);

  /** Applies a choice and remembers its label across later remote searches. */
  function selectOption(option: Option | null) {
    if (option === null) {
      onChange(null);
    } else {
      setKnownLabels((current) => ({ ...current, [option.id]: option.label }));
      onChange(option.id);
    }

    setOpen(false);
    setSearch("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          className="h-9 w-full justify-between rounded-control text-xs font-normal"
        >
          <span className={cn("truncate", value === null && "text-muted-foreground")}>
            {selectedLabel}
          </span>
          <ChevronsUpDownIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-(--radix-popover-trigger-width) p-0",
          !open && "pointer-events-none",
        )}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <CommandList>
            <CommandItem value="__all__" onSelect={() => selectOption(null)}>
              <CheckIcon
                aria-hidden="true"
                className={cn("size-4", value === null ? "opacity-100" : "opacity-0")}
              />
              {placeholder}
            </CommandItem>
            {query.isPending && availableOptions.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Đang tải…</p>
            ) : availableOptions.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">{emptyMessage}</p>
            ) : (
              availableOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={String(option.id)}
                  onSelect={() => selectOption(option)}
                >
                  <CheckIcon
                    aria-hidden="true"
                    className={cn("size-4", value === option.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Reports whether a keyword, filter, or non-default ordering is applied. */
export function hasTeacherConditions({
  search,
  filterCount,
  sort,
}: {
  search: string;
  filterCount: number;
  sort: TeacherListSort;
}): boolean {
  return search !== "" || filterCount > 0 || sort !== "newest";
}

/** Renders every applied teacher condition as a removable chip. */
export function TeacherConditionsBar({
  search,
  filters,
  sort,
  subjectOptions,
  classOptions,
  onSearchChange,
  onSubjectChange,
  onClassChange,
  onAccountActiveChange,
  onJoinedFromChange,
  onJoinedToChange,
  onSortChange,
  onClearConditions,
  hasConditions,
}: {
  search: string;
  filters: TeacherFilterState;
  sort: TeacherListSort;
  subjectOptions: Option[];
  classOptions: Option[];
  onSearchChange: (value: string) => void;
  onSubjectChange: (subjectId: number | null) => void;
  onClassChange: (classId: number | null) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onJoinedFromChange: (value: string) => void;
  onJoinedToChange: (value: string) => void;
  onSortChange: (sort: TeacherListSort) => void;
  onClearConditions: () => void;
  hasConditions: boolean;
}) {
  const subjectLabel = subjectOptions.find((option) => option.id === filters.subjectId)?.label;
  const classLabel = classOptions.find((option) => option.id === filters.classId)?.label;

  return (
    <ConditionsBar
      heading="Đang áp dụng"
      align="start"
      onClearAll={onClearConditions}
      hasConditions={hasConditions}
    >
      {search ? (
        <ConditionTag
          tone="neutral"
          caption="Từ khóa"
          label={`“${search}”`}
          onRemove={() => onSearchChange("")}
        />
      ) : null}

      {filters.subjectId !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Bộ môn"
          label={subjectLabel ?? `#${filters.subjectId}`}
          onRemove={() => onSubjectChange(null)}
        />
      ) : null}

      {filters.classId !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Lớp"
          label={classLabel ?? `#${filters.classId}`}
          onRemove={() => onClassChange(null)}
        />
      ) : null}

      {filters.isActive !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Tài khoản"
          label={filters.isActive ? "Đang hoạt động" : "Đã khóa"}
          onRemove={() => onAccountActiveChange(null)}
        />
      ) : null}

      {filters.joinedFrom ? (
        <ConditionTag
          tone="neutral"
          caption="Từ ngày"
          label={formatDate(filters.joinedFrom)}
          onRemove={() => onJoinedFromChange("")}
        />
      ) : null}

      {filters.joinedTo ? (
        <ConditionTag
          tone="neutral"
          caption="Đến ngày"
          label={formatDate(filters.joinedTo)}
          onRemove={() => onJoinedToChange("")}
        />
      ) : null}

      {sort !== "newest" ? (
        <ConditionTag
          tone="neutral"
          caption="Sắp xếp"
          label={TEACHER_LIST_SORT_LABELS[sort]}
          onRemove={() => onSortChange("newest")}
        />
      ) : null}
    </ConditionsBar>
  );
}
