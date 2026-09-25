"use client";

import { ArrowUpDown, Plus, RefreshCw } from "lucide-react";

import {
  DataTablePagination,
  ListSheet,
  ListSkeleton,
  ListTable,
  ResponsiveListView,
  StatePanel,
  type DataTableState,
  type ListTableColumn,
} from "@/components/shared/data-table";
import { AppButton } from "@/components/shared/app-button";
import { InlineBadge } from "@/components/shared/inline-badge";
import { PageHeading } from "@/components/shared/page-heading";
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
      <PageHeading
        title="Môn học"
        badges={
          <InlineBadge>
            <strong className="text-xs text-foreground">{meta.total}</strong> môn
          </InlineBadge>
        }
        description="Quản lý môn học, khối áp dụng và các lớp đang sử dụng."
        action={
          <AppButton href="/academic/subjects/new">
            <Plus aria-hidden="true" className="size-[19px]" />
            Thêm môn học
          </AppButton>
        }
      />

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
          <SubjectConditionsBar
            search={search}
            filters={filters}
            sort={sort}
            hasConditions={conditions}
            onSearchChange={onSearchChange}
            onGradeLevelChange={onGradeLevelChange}
            onActiveChange={onActiveChange}
            onSortChange={onSortChange}
            onClearConditions={onClearConditions}
          />
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
    return (
      <ListSkeleton
        view={view}
        label="Đang tải danh sách môn học"
        table={{
          columnCount: 5,
          columnTemplate: "35fr 31fr 15fr 16fr 3fr",
          shortCycle: 4,
        }}
      />
    );
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
            <AppButton size="sm" variant="outline" onClick={state.onRetry}>
              <RefreshCw aria-hidden="true" />
              Thử lại
            </AppButton>
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
          <AppButton size="sm" variant="outline" onClick={onClearConditions}>
            Xóa điều kiện
          </AppButton>
        }
      />
    ) : (
      <StatePanel
        image="/images/empty_1.png"
        imageAlt="Chú cú VietClasses vẫy chào"
        title="Chưa có môn học"
        description="Thêm môn học đầu tiên để bắt đầu mở lớp."
        action={
          <AppButton href="/academic/subjects/new" size="sm">
            <Plus aria-hidden="true" />
            Thêm môn học
          </AppButton>
        }
      />
    );
  }

  return (
    <ResponsiveListView
      view={view}
      table={
        <SubjectTable
          rows={state.rows}
          sort={sort}
          onSortChange={onSortChange}
          onView={onView}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      }
      grid={
        <SubjectGrid
          state={state}
          onView={onView}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      }
    />
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
  const columns: ListTableColumn<Subject>[] = [
    {
      key: "subject",
      header: (
        <SortableSubjectHead
          label="Môn học"
          active={sort.startsWith("name-")}
          onClick={() => onSortChange(nextNameSort(sort))}
        />
      ),
      width: 35,
      ariaSort: subjectSortDirection(sort, "name"),
      cell: (subject) => <SubjectIdentity subject={subject} onView={onView} />,
    },
    {
      key: "grades",
      header: "Khối áp dụng",
      width: 31,
      cell: (subject) => <SubjectGradeLevels subject={subject} />,
    },
    {
      key: "classes",
      header: (
        <SortableSubjectHead
          label="Lớp học"
          active={sort.startsWith("classes-")}
          onClick={() => onSortChange(nextClassesSort(sort))}
        />
      ),
      width: 15,
      ariaSort: subjectSortDirection(sort, "classes"),
      cell: (subject) => <SubjectClassCount subject={subject} />,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: 16,
      cell: (subject) => <SubjectStatusBadge subject={subject} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      width: 3,
      cell: (subject) => (
        <SubjectRowMenu
          subject={subject}
          onView={onView}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
          className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        />
      ),
    },
  ];

  return (
    <ListTable
      ariaLabel="Danh sách môn học"
      columns={columns}
      rows={rows}
      rowKey={(subject) => subject.id}
      minWidth={820}
    />
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
