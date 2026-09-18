"use client";

import Link from "next/link";
import { ArrowUpDown, Plus, RefreshCw } from "lucide-react";

import {
  DataTablePagination,
  ListSheet,
  StatePanel,
  type DataTableState,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PageMeta } from "@/lib/api/contracts";

import type { GradeLevel, Subject } from "../types/academic";
import {
  SUBJECT_TABLE_PAGE_SIZES,
  type SubjectFilterState,
  type SubjectListSort,
  type SubjectListView,
} from "../utils/subject-list-controls";
import {
  SubjectClassCount,
  SubjectGradeLevels,
  SubjectIdentity,
  SubjectRowMenu,
  SubjectStatusBadge,
} from "./subject-cells";
import { SubjectGrid } from "./subject-grid";
import { SubjectListSkeleton } from "./subject-list-skeleton";
import {
  hasSubjectConditions,
  SubjectConditionsBar,
  SubjectListToolbar,
} from "./subject-list-toolbar";

/** What the subject list screen renders and reports back. */
export type SubjectsViewProps = {
  state: DataTableState<Subject>;
  meta: PageMeta;
  search: string;
  filters: SubjectFilterState;
  filterCount: number;
  sort: SubjectListSort;
  view: SubjectListView;
  tablePageSize: number;
  onSearchChange: (value: string) => void;
  onGradeLevelChange: (gradeLevel: GradeLevel | null) => void;
  onActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: SubjectListSort) => void;
  onViewChange: (view: SubjectListView) => void;
  onTablePageSizeChange: (pageSize: number) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onView: (subject: Subject) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
};

/** Renders the subject heading, list controls, rows, and pager in one sheet. */
export function SubjectsView({
  state,
  meta,
  search,
  filters,
  filterCount,
  sort,
  view,
  tablePageSize,
  onSearchChange,
  onGradeLevelChange,
  onActiveChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onTablePageSizeChange,
  onClearConditions,
  onPageChange,
  onView,
  onToggleActive,
  onDelete,
}: SubjectsViewProps) {
  const conditions = hasSubjectConditions({ search, filterCount, sort });

  return (
    <div className="grid gap-6">
      <SubjectsHeading total={meta.total} />

      <ListSheet
        toolbar={
          <SubjectListToolbar
            search={search}
            onSearchChange={onSearchChange}
            filters={filters}
            filterCount={filterCount}
            sort={sort}
            view={view}
            onGradeLevelChange={onGradeLevelChange}
            onActiveChange={onActiveChange}
            onClearFilters={onClearFilters}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
        }
        conditions={
          conditions ? (
            <SubjectConditionsBar
              search={search}
              filters={filters}
              sort={sort}
              onSearchChange={onSearchChange}
              onGradeLevelChange={onGradeLevelChange}
              onActiveChange={onActiveChange}
              onSortChange={onSortChange}
              onClearConditions={onClearConditions}
            />
          ) : undefined
        }
        pager={
          state.kind === "content" ? (
            <DataTablePagination
              numbered
              unit="môn học"
              meta={meta}
              onPageChange={onPageChange}
              pageSize={view === "table" ? tablePageSize : undefined}
              pageSizeOptions={view === "table" ? SUBJECT_TABLE_PAGE_SIZES : undefined}
              onPageSizeChange={view === "table" ? onTablePageSizeChange : undefined}
            />
          ) : undefined
        }
      >
        <div aria-busy={state.kind === "loading"}>
          <SubjectResults
            state={state}
            view={view}
            hasConditions={conditions}
            onClearConditions={onClearConditions}
            onView={onView}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
            sort={sort}
            onSortChange={onSortChange}
          />
        </div>
      </ListSheet>
    </div>
  );
}

function SubjectsHeading({ total }: { total: number }) {
  return (
    <div className="flex items-start justify-between gap-3 md:items-end">
      <div>
        <div className="flex flex-col md:flex-row md:items-end md:gap-4">
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
            Môn học
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-muted-foreground md:mt-0 md:mb-1.5">
            <strong className="font-mono text-[15px] text-foreground">{total}</strong> môn
          </p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
          Quản lý môn học, khối áp dụng và các lớp đang sử dụng.
        </p>
      </div>

      <Button
        asChild
        className="h-11 gap-2 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px] max-md:has-[>svg]:px-3"
      >
        <Link href="/academic/subjects/new">
          <Plus aria-hidden="true" className="size-[19px]" />
          <span className="max-md:sr-only">Thêm môn học</span>
        </Link>
      </Button>
    </div>
  );
}

function SubjectResults({
  state,
  view,
  hasConditions,
  onClearConditions,
  onView,
  onToggleActive,
  onDelete,
  sort,
  onSortChange,
}: {
  state: DataTableState<Subject>;
  view: SubjectListView;
  hasConditions: boolean;
  onClearConditions: () => void;
  onView: (subject: Subject) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  sort: SubjectListSort;
  onSortChange: (sort: SubjectListSort) => void;
}) {
  if (state.kind === "loading") {
    return <SubjectListSkeleton />;
  }

  if (state.kind === "error") {
    return (
      <StatePanel
        role="alert"
        image="/images/error.webp"
        imageAlt="Chú cú VietClasses hoa mắt vì tải dữ liệu thất bại"
        title="Chưa tải được danh sách môn học"
        description={state.message}
        action={
          state.onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={state.onRetry}>
              <RefreshCw aria-hidden="true" />
              Thử lại
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (state.kind === "empty") {
    return hasConditions ? (
      <StatePanel
        image="/images/empty_2.png"
        imageAlt="Chú cú VietClasses cầm kính lúp tìm kiếm"
        title="Không tìm thấy môn học phù hợp"
        description="Thử đổi tên môn học hoặc xóa bớt điều kiện lọc."
        action={
          <Button type="button" variant="outline" size="sm" onClick={onClearConditions}>
            Xóa điều kiện
          </Button>
        }
      />
    ) : (
      <StatePanel
        image="/images/empty_1.png"
        imageAlt="Chú cú VietClasses vẫy chào"
        title="Chưa có môn học"
        description="Thêm môn học đầu tiên để bắt đầu mở lớp."
        action={
          <Button asChild size="sm">
            <Link href="/academic/subjects/new">
              <Plus aria-hidden="true" />
              Thêm môn học
            </Link>
          </Button>
        }
      />
    );
  }

  if (view === "grid") {
    return (
      <SubjectGrid
        state={state}
        onView={onView}
        onToggleActive={onToggleActive}
        onDelete={onDelete}
      />
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <SubjectTable
          rows={state.rows}
          sort={sort}
          onSortChange={onSortChange}
          onView={onView}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>
      <div className="lg:hidden">
        <SubjectGrid
          state={state}
          onView={onView}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>
    </>
  );
}

function SubjectTable({
  rows,
  sort,
  onSortChange,
  onView,
  onToggleActive,
  onDelete,
}: {
  rows: Subject[];
  sort: SubjectListSort;
  onSortChange: (sort: SubjectListSort) => void;
  onView: (subject: Subject) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}) {
  return (
    <Table aria-label="Danh sách môn học" className="min-w-[820px] table-fixed">
      <colgroup>
        <col className="w-[35%]" />
        <col className="w-[31%]" />
        <col className="w-[15%]" />
        <col className="w-[16%]" />
        <col className="w-[3%]" />
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent [&_th]:border-b [&_th]:border-vc-rule [&_th]:px-3 [&_th]:text-[11px] [&_th]:tracking-[0.06em] [&_th]:text-muted-foreground [&_th]:uppercase">
          <TableHead aria-sort={subjectSortDirection(sort, "name")}>
            <SortableSubjectHead
              label="Môn học"
              active={sort.startsWith("name-")}
              onClick={() => onSortChange(nextNameSort(sort))}
            />
          </TableHead>
          <TableHead>Khối áp dụng</TableHead>
          <TableHead aria-sort={subjectSortDirection(sort, "classes")}>
            <SortableSubjectHead
              label="Lớp học"
              active={sort.startsWith("classes-")}
              onClick={() => onSortChange(nextClassesSort(sort))}
            />
          </TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>
            <span className="sr-only">Thao tác</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((subject) => (
          <TableRow
            key={subject.id}
            className="group border-vc-rule hover:bg-vc-tint focus-within:bg-vc-tint has-aria-expanded:bg-vc-tint [&_td]:h-[68px] [&_td]:px-3"
          >
            <TableCell>
              <SubjectIdentity subject={subject} onView={onView} />
            </TableCell>
            <TableCell>
              <SubjectGradeLevels subject={subject} />
            </TableCell>
            <TableCell>
              <SubjectClassCount subject={subject} />
            </TableCell>
            <TableCell>
              <SubjectStatusBadge subject={subject} />
            </TableCell>
            <TableCell>
              <SubjectRowMenu
                subject={subject}
                onView={onView}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
                className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortableSubjectHead({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Sắp xếp theo ${label.toLocaleLowerCase("vi-VN")}`}
      className={`inline-flex min-h-8 items-center gap-[7px] text-left text-inherit font-inherit tracking-inherit uppercase ${active ? "text-foreground" : ""} hover:text-foreground`}
      onClick={onClick}
    >
      {label}
      <ArrowUpDown aria-hidden="true" className="size-3.5" />
    </button>
  );
}

function subjectSortDirection(
  sort: SubjectListSort,
  key: "name" | "classes",
): "ascending" | "descending" | "none" {
  if (key === "name") {
    return sort === "name-asc" ? "ascending" : sort === "name-desc" ? "descending" : "none";
  }

  return sort === "classes-asc" ? "ascending" : sort === "classes-desc" ? "descending" : "none";
}

function nextNameSort(sort: SubjectListSort): SubjectListSort {
  return sort === "name-asc" ? "name-desc" : "name-asc";
}

function nextClassesSort(sort: SubjectListSort): SubjectListSort {
  return sort === "classes-asc" ? "classes-desc" : "classes-asc";
}
