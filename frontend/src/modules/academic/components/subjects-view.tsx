"use client";

import Link from "next/link";
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, MoreHorizontal, Plus } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  EmptyState,
  FilterPopover,
  FilterSection,
  ListSheet,
  ListToolbar,
  SortPopover,
  type DataTableColumn,
  type DataTableState,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageMeta } from "@/lib/api/contracts";

import type { GradeLevel, Subject } from "../types/academic";
import { GRADE_LEVEL_LABELS, GRADE_LEVELS } from "../utils/labels";
import type { SubjectFilterState, SubjectListSort } from "../utils/subject-list-controls";

/** What the subject list screen renders and reports back. */
export type SubjectsViewProps = {
  state: DataTableState<Subject>;
  meta: PageMeta;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  filters: SubjectFilterState;
  filterCount: number;
  sort: SubjectListSort;
  tablePageSize: number;
  onGradeLevelChange: (gradeLevel: GradeLevel | null) => void;
  onActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: SubjectListSort) => void;
  onTablePageSizeChange: (pageSize: number) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
};

/**
 * Renders the subject list: the heading, the search box, the table, and the pager.
 *
 * Each row carries how many running classes teach the subject, because that count
 * is exactly what decides whether it can be locked, and showing it here saves the
 * reader from finding out by being refused.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function SubjectsView({
  state,
  meta,
  search,
  onSearchChange,
  onPageChange,
  filters, filterCount, sort, tablePageSize, onGradeLevelChange, onActiveChange, onClearFilters, onSortChange, onTablePageSizeChange,
  onToggleActive,
  onDelete,
}: SubjectsViewProps) {
  const columns: DataTableColumn<Subject>[] = [
    {
      key: "name",
      header: "Môn học",
      cell: (subject) => (
        <div className="grid min-w-0 gap-0.5">
          <span className="truncate font-medium">{subject.name}</span>
          <span className="truncate text-xs text-muted-foreground">{subject.description ?? "Chưa có mô tả"}</span>
        </div>
      ),
    },
    {
      key: "grade_levels",
      header: "Khối áp dụng",
      hideOnMobile: true,
      cell: (subject) => <SubjectGradeLevels subject={subject} />,
    },
    {
      key: "classes",
      header: "Lớp học",
      hideOnMobile: true,
      className: "w-44",
      cell: (subject) => <span className="font-mono">{subject.active_classes_count ?? 0} lớp</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-36",
      cell: (subject) => (
        <StatusBadge
          status={subject.is_active ? "active" : "inactive"}
          label={subject.is_active ? "Hoạt động" : "Ngừng hoạt động"}
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (subject) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${subject.name}`}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/academic/subjects/${subject.id}`}>Sửa</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleActive(subject)}>
              {subject.is_active ? "Khóa môn học" : "Mở môn học"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(subject)}>
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const hasQuery = search !== "";

  // Nothing has ever been added yet, and no search is even in play — the toolbar
  // and table would only frame an empty table, so the empty state takes over the
  // whole screen instead of sitting inside it.
  if (state.kind === "empty" && !hasQuery) {
    return (
      <EmptyState
        title="Chưa có môn học nào."
        description="Thêm môn học đầu tiên để mở lớp."
        image="/images/empty_1.png"
        action={
          <Button asChild size="sm">
            <Link href="/academic/subjects/new">
              <Plus aria-hidden="true" />
              Thêm môn học
            </Link>
          </Button>
        }
        className="min-h-[50svh] content-center"
      />
    );
  }

  // Past that point, an empty result means the current search rules everything
  // out — the toolbar stays, since clearing it is the way out.
  const listState: DataTableState<Subject> =
    state.kind === "empty"
      ? {
          kind: "empty",
          message: "Không tìm thấy môn học nào khớp.",
          description: "Thử đổi từ khóa tìm kiếm.",
          image: "/images/empty_2.png",
          action: (
            <Button type="button" variant="outline" size="sm" onClick={() => onSearchChange("")}>
              Xóa tìm kiếm
            </Button>
          ),
        }
      : state;

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex flex-col md:flex-row md:items-end md:gap-4">
            <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">Môn học</h2>
            <p className="mt-1 text-[13px] font-semibold text-muted-foreground md:mt-0 md:mb-1.5"><strong className="font-mono text-[15px] text-foreground">{meta.total}</strong> môn</p>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">Quản lý môn học, khối áp dụng và các lớp đang sử dụng.</p>
        </div>
        <Button asChild className="h-11 rounded-control border border-vc-wood shadow-vc-raised">
          <Link href="/academic/subjects/new">
            <Plus aria-hidden="true" />
            <span className="max-md:sr-only">Thêm môn học</span>
          </Link>
        </Button>
      </div>

      <ListSheet
        toolbar={<ListToolbar search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm tên môn học…" searchAriaLabel="Tìm kiếm môn học" size="control" align="start">
          <FilterPopover compact count={filterCount} onClear={onClearFilters} note="Thay đổi được áp dụng ngay.">
            <FilterSection label="Khối áp dụng">
              <div className="flex flex-wrap gap-1.5">
                {GRADE_LEVELS.map((gradeLevel) => <button key={gradeLevel} type="button" aria-pressed={filters.gradeLevel === gradeLevel} onClick={() => onGradeLevelChange(filters.gradeLevel === gradeLevel ? null : gradeLevel)} className="h-7 rounded-control border px-2 text-[11px] hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep">{gradeLevel === 0 ? "Tiền TH" : `Khối ${gradeLevel}`}</button>)}
              </div>
            </FilterSection>
            <FilterSection label="Trạng thái" last>
              <div className="grid grid-cols-3 overflow-hidden rounded-control border">
                {([[null, "Tất cả"], [true, "Đang mở"], [false, "Đã khóa"]] as const).map(([value, label]) => <button key={label} type="button" aria-pressed={filters.isActive === value} onClick={() => onActiveChange(value)} className="h-8 border-r text-xs last:border-r-0 hover:bg-orange-50 aria-pressed:bg-orange-50 aria-pressed:font-medium aria-pressed:text-vc-orange-deep">{label}</button>)}
              </div>
            </FilterSection>
          </FilterPopover>
          <SortPopover compact value={sort} isActive={sort !== "newest"} onChange={onSortChange} options={[
            { value: "name-asc", label: "Tên A–Z", icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
            { value: "name-desc", label: "Tên Z–A", icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
            { value: "classes-desc", label: "Nhiều lớp đang chạy", icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
            { value: "newest", label: "Mới tạo gần đây", icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
          ]} />
        </ListToolbar>}
        pager={<DataTablePagination meta={meta} onPageChange={onPageChange} numbered unit="môn học" pageSize={tablePageSize} pageSizeOptions={[10, 20, 50, 100]} onPageSizeChange={onTablePageSizeChange} />}
      >
        <DataTable columns={columns} state={listState} rowKey={(subject) => subject.id} />
      </ListSheet>
    </div>
  );
}

/** Renders the compact grade chips and opens the complete set from the +N chip. */
function SubjectGradeLevels({ subject }: { subject: Subject }) {
  const extraCount = Math.max(subject.grade_levels.length - 3, 0);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {subject.grade_levels.slice(0, 3).map((gradeLevel) => (
        <span
          key={gradeLevel}
          title={GRADE_LEVEL_LABELS[gradeLevel]}
          className="inline-flex min-h-7 items-center rounded-control border border-vc-control bg-background px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
        >
          {formatGradeLevel(gradeLevel)}
        </span>
      ))}
      {extraCount > 0 ? (
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`Xem thêm ${extraCount} khối áp dụng của ${subject.name}`}
              title={`${extraCount} khối áp dụng khác`}
              className="inline-flex min-h-7 items-center rounded-control border border-vc-control bg-vc-tint px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors hover:bg-vc-tint/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              +{extraCount}
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-sheet border-vc-wood bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Các khối áp dụng</DialogTitle>
              <DialogDescription>
                {subject.name} đang áp dụng cho {subject.grade_levels.length} khối.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {subject.grade_levels.map((gradeLevel) => (
                <span
                  key={gradeLevel}
                  className="inline-flex min-h-8 items-center rounded-control border border-vc-control bg-background px-3 py-1.5 text-xs font-semibold"
                >
                  {formatGradeLevel(gradeLevel)}
                </span>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

/** Keeps the table and the grade detail modal on the same short labels. */
function formatGradeLevel(gradeLevel: GradeLevel): string {
  return gradeLevel === 0 ? "Tiền TH" : `Khối ${gradeLevel}`;
}
