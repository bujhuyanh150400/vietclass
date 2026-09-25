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

import type { Option, Teacher } from "../types/academic";
import {
  type TeacherFilterState,
  type TeacherListSort,
  type TeacherListView,
} from "../utils/teacher-list-controls";
import {
  TeacherAccountBadge,
  TeacherClasses,
  TeacherContact,
  TeacherIdentity,
  TeacherJoinedDate,
  TeacherRowMenu,
  TeacherSubjects,
} from "./teacher-cells";
import { TeacherGrid } from "./teacher-grid";
import {
  hasTeacherConditions,
  TeacherConditionsBar,
  TeacherListToolbar,
} from "./teacher-list-toolbar";

/** What the teacher directory screen renders and reports back. */
export type TeachersViewProps = {
  state: DataTableState<Teacher>;
  meta: PageMeta;
  search: string;
  filters: TeacherFilterState;
  filterCount: number;
  sort: TeacherListSort;
  view: TeacherListView;
  tablePageSize: number;
  subjectOptions: Option[];
  classOptions: Option[];
  onSearchChange: (value: string) => void;
  onSubjectChange: (subjectId: number | null) => void;
  onClassChange: (classId: number | null) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onJoinedFromChange: (value: string) => void;
  onJoinedToChange: (value: string) => void;
  onClearFilters: () => void;
  onSortChange: (sort: TeacherListSort) => void;
  onViewChange: (view: TeacherListView) => void;
  onTablePageSizeChange: (pageSize: number) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onViewTeacher: (teacher: Teacher) => void;
  onToggleAccount: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
};

/** Renders the teacher heading, controls, responsive results, and pager in one sheet. */
export function TeachersView({
  state,
  meta,
  search,
  filters,
  filterCount,
  sort,
  view,
  tablePageSize,
  subjectOptions,
  classOptions,
  onSearchChange,
  onSubjectChange,
  onClassChange,
  onAccountActiveChange,
  onJoinedFromChange,
  onJoinedToChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onTablePageSizeChange,
  onClearConditions,
  onPageChange,
  onViewTeacher,
  onToggleAccount,
  onChangePassword,
}: TeachersViewProps) {
  const conditions = hasTeacherConditions({ search, filterCount, sort });

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Giáo viên"
        badges={
          <InlineBadge>
            <strong className="text-xs text-foreground">{meta.total}</strong> hồ sơ
          </InlineBadge>
        }
        description="Quản lý hồ sơ, tài khoản và các lớp giáo viên đang phụ trách."
        action={
          <AppButton href="/academic/teachers/new">
            <Plus aria-hidden="true" className="size-[19px]" />
            Thêm giáo viên
          </AppButton>
        }
      />

      <ListSheet
        toolbar={
          <TeacherListToolbar
            search={search}
            onSearchChange={onSearchChange}
            filters={filters}
            filterCount={filterCount}
            sort={sort}
            view={view}
            subjectOptions={subjectOptions}
            classOptions={classOptions}
            onSubjectChange={onSubjectChange}
            onClassChange={onClassChange}
            onAccountActiveChange={onAccountActiveChange}
            onJoinedFromChange={onJoinedFromChange}
            onJoinedToChange={onJoinedToChange}
            onClearFilters={onClearFilters}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
        }
        conditions={
          <TeacherConditionsBar
            search={search}
            filters={filters}
            sort={sort}
            hasConditions={conditions}
            subjectOptions={subjectOptions}
            classOptions={classOptions}
            onSearchChange={onSearchChange}
            onSubjectChange={onSubjectChange}
            onClassChange={onClassChange}
            onAccountActiveChange={onAccountActiveChange}
            onJoinedFromChange={onJoinedFromChange}
            onJoinedToChange={onJoinedToChange}
            onSortChange={onSortChange}
            onClearConditions={onClearConditions}
          />
        }
        pager={
          state.kind === "content" ? (
            <DataTablePagination
              numbered
              unit="hồ sơ"
              meta={meta}
              onPageChange={onPageChange}
              pageSize={tablePageSize}
              pageSizeOptions={[10, 20, 50, 100, 200]}
              onPageSizeChange={onTablePageSizeChange}
            />
          ) : undefined
        }
      >
        <div aria-busy={state.kind === "loading"}>
          <TeacherResults
            state={state}
            view={view}
            hasConditions={conditions}
            onClearConditions={onClearConditions}
            sort={sort}
            onSortChange={onSortChange}
            onViewTeacher={onViewTeacher}
            onToggleAccount={onToggleAccount}
            onChangePassword={onChangePassword}
          />
        </div>
      </ListSheet>
    </div>
  );
}

function TeacherResults({
  state,
  view,
  hasConditions,
  onClearConditions,
  sort,
  onSortChange,
  onViewTeacher,
  onToggleAccount,
  onChangePassword,
}: {
  state: DataTableState<Teacher>;
  view: TeacherListView;
  hasConditions: boolean;
  onClearConditions: () => void;
  sort: TeacherListSort;
  onSortChange: (sort: TeacherListSort) => void;
  onViewTeacher: (teacher: Teacher) => void;
  onToggleAccount: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
}) {
  if (state.kind === "loading") {
    return (
      <ListSkeleton
        view={view}
        label="Đang tải danh sách giáo viên"
        table={{
          columnCount: 7,
          columnTemplate: "22fr 16fr 16fr 18fr 14fr 10fr 4fr",
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
        title="Chưa tải được danh sách giáo viên"
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
        title="Không tìm thấy giáo viên phù hợp"
        description="Thử đổi từ khóa hoặc xóa bớt điều kiện lọc."
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
        title="Chưa có giáo viên"
        description="Thêm giáo viên đầu tiên để bắt đầu phân công lớp."
        action={
          <AppButton href="/academic/teachers/new" size="sm">
            <Plus aria-hidden="true" />
            Thêm giáo viên
          </AppButton>
        }
      />
    );
  }

  return (
    <ResponsiveListView
      view={view}
      table={
        <TeacherTable
          rows={state.rows}
          sort={sort}
          onSortChange={onSortChange}
          onView={onViewTeacher}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
        />
      }
      grid={
        <TeacherGrid
          state={state}
          onView={onViewTeacher}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
        />
      }
    />
  );
}

function TeacherTable({
  rows,
  sort,
  onSortChange,
  onView,
  onToggleAccount,
  onChangePassword,
}: {
  rows: Teacher[];
  sort: TeacherListSort;
  onSortChange: (sort: TeacherListSort) => void;
  onView: (teacher: Teacher) => void;
  onToggleAccount: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
}) {
  const columns: ListTableColumn<Teacher>[] = [
    {
      key: "teacher",
      header: (
        <SortableTeacherHead
          label="Giáo viên"
          active={sort.startsWith("name-")}
          onClick={() => onSortChange(nextNameSort(sort))}
        />
      ),
      width: 22,
      ariaSort: teacherSortDirection(sort, "name"),
      cell: (teacher) => <TeacherIdentity teacher={teacher} onView={onView} />,
    },
    {
      key: "contact",
      header: "Liên hệ",
      width: 16,
      cell: (teacher) => <TeacherContact teacher={teacher} />,
    },
    {
      key: "subjects",
      header: "Bộ môn",
      width: 16,
      cell: (teacher) => <TeacherSubjects teacher={teacher} />,
    },
    {
      key: "classes",
      header: "Lớp phụ trách",
      width: 18,
      cell: (teacher) => <TeacherClasses teacher={teacher} />,
    },
    {
      key: "account",
      header: "Tài khoản",
      width: 14,
      cell: (teacher) => <TeacherAccountBadge teacher={teacher} />,
    },
    {
      key: "joined",
      header: (
        <SortableTeacherHead
          label="Ngày tham gia"
          active={sort === "newest" || sort === "date-asc"}
          onClick={() => onSortChange(nextDateSort(sort))}
        />
      ),
      width: 10,
      ariaSort: teacherSortDirection(sort, "date"),
      cell: (teacher) => <TeacherJoinedDate teacher={teacher} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      width: 4,
      cell: (teacher) => (
        <TeacherRowMenu
          teacher={teacher}
          onView={onView}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
          className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        />
      ),
    },
  ];

  return (
    <ListTable
      ariaLabel="Danh sách giáo viên"
      columns={columns}
      rows={rows}
      rowKey={(teacher) => teacher.id}
      minWidth={1120}
    />
  );
}


function SortableTeacherHead({
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

function teacherSortDirection(
  sort: TeacherListSort,
  key: "name" | "date",
): "ascending" | "descending" | "none" {
  if (key === "name") {
    return sort === "name-asc" ? "ascending" : sort === "name-desc" ? "descending" : "none";
  }

  return sort === "date-asc" ? "ascending" : sort === "newest" ? "descending" : "none";
}

function nextNameSort(sort: TeacherListSort): TeacherListSort {
  return sort === "name-asc" ? "name-desc" : "name-asc";
}

function nextDateSort(sort: TeacherListSort): TeacherListSort {
  return sort === "newest" ? "date-asc" : "newest";
}
