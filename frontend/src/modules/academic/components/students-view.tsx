"use client";

import { Plus, RefreshCw } from "lucide-react";

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
import { StatusBadge } from "@/components/shared/status-badge";
import type { PageMeta } from "@/lib/api/contracts";

import type { Student } from "../types/academic";
import {
  STUDENT_TABLE_PAGE_SIZES,
  type StudentFilterState,
  type StudentListSort,
  type StudentListView,
} from "../utils/student-list-controls";
import { GradeToken, StudentIdentity, StudentRowMenu } from "./student-cells";
import { ClassTags, GuardianTags } from "./student-entity-tags";
import { StudentGrid } from "./student-grid";
import {
  StudentConditionsBar,
  StudentListToolbar,
  hasStudentConditions,
} from "./student-list-toolbar";

/** What the student list screen renders and reports back. */
export type StudentsViewProps = {
  state: DataTableState<Student>;
  meta: PageMeta;
  search: string;
  filters: StudentFilterState;
  filterCount: number;
  sort: StudentListSort;
  view: StudentListView;
  tablePageSize: number;
  onSearchChange: (value: string) => void;
  onToggleGradeLevel: (gradeLevel: Student["grade_level"]) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: StudentListSort) => void;
  onViewChange: (view: StudentListView) => void;
  onTablePageSizeChange: (pageSize: number) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
  canUpdate: boolean;
  canToggleAccount: boolean;
};

/**
 * Renders the student list: the heading, one sheet holding the controls and the
 * rows, and the pager along its bottom edge.
 *
 * Guardians and current classes sit beside the student rather than on a separate
 * screen, because between them they answer what anyone looking a student up
 * actually came for: who to call, and which classes they are in.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function StudentsView({
  state,
  meta,
  search,
  filters,
  filterCount,
  sort,
  view,
  tablePageSize,
  onSearchChange,
  onToggleGradeLevel,
  onAccountActiveChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onTablePageSizeChange,
  onClearConditions,
  onPageChange,
  onToggleAccount,
  onChangePassword,
  canUpdate,
  canToggleAccount,
}: StudentsViewProps) {
  const hasConditions = hasStudentConditions({ search, filterCount, sort });

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Học sinh"
        badges={
          <InlineBadge>
            <strong className="text-xs text-foreground">{meta.total}</strong> hồ sơ
          </InlineBadge>
        }
        description="Quản lý hồ sơ, liên hệ gia đình và lớp đang theo học."
        action={
          <AppButton href="/academic/students/new">
            <Plus aria-hidden="true" className="size-[19px]" />
            Thêm học sinh
          </AppButton>
        }
      />

      <ListSheet
        toolbar={
          <StudentListToolbar
            search={search}
            onSearchChange={onSearchChange}
            filters={filters}
            filterCount={filterCount}
            sort={sort}
            view={view}
            onToggleGradeLevel={onToggleGradeLevel}
            onAccountActiveChange={onAccountActiveChange}
            onClearFilters={onClearFilters}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
        }
        conditions={
          <StudentConditionsBar
            search={search}
            filters={filters}
            sort={sort}
            hasConditions={hasConditions}
            onSearchChange={onSearchChange}
            onToggleGradeLevel={onToggleGradeLevel}
            onAccountActiveChange={onAccountActiveChange}
            onSortChange={onSortChange}
            onClearConditions={onClearConditions}
          />
        }
        pager={
          state.kind === "content" ? (
            <DataTablePagination
              numbered
              unit="học sinh"
              meta={meta}
              onPageChange={onPageChange}
              pageSize={view === "table" ? tablePageSize : undefined}
              pageSizeOptions={view === "table" ? STUDENT_TABLE_PAGE_SIZES : undefined}
              onPageSizeChange={view === "table" ? onTablePageSizeChange : undefined}
            />
          ) : undefined
        }
      >
        <div aria-busy={state.kind === "loading"}>
          <StudentResults
            state={state}
            hasConditions={hasConditions}
            onClearConditions={onClearConditions}
            onToggleAccount={onToggleAccount}
            onChangePassword={onChangePassword}
            canUpdate={canUpdate}
            canToggleAccount={canToggleAccount}
            view={view}
          />
        </div>
      </ListSheet>
    </div>
  );
}

/**
 * Renders whichever of the four list states currently applies.
 *
 * Every state stays inside the sheet, including "nothing here yet": the toolbar
 * above it is how a reader gets back out of a search that matched nothing, and
 * removing it under them would strand them.
 */
function StudentResults({
  state,
  hasConditions,
  view,
  onClearConditions,
  onToggleAccount,
  onChangePassword,
  canUpdate,
  canToggleAccount,
}: {
  state: DataTableState<Student>;
  hasConditions: boolean;
  view: StudentListView;
  onClearConditions: () => void;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
  canUpdate: boolean;
  canToggleAccount: boolean;
}) {
  if (state.kind === "loading") {
    return (
      <ListSkeleton
        view={view}
        label="Đang tải danh sách học sinh"
        table={{
          columnCount: 6,
          columnTemplate: "21fr 5.5fr 32fr 26fr 10fr 5.5fr",
          shortCycle: 5,
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
        title="Chưa tải được danh sách"
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
        title="Không tìm thấy kết quả"
        description="Thử bỏ bớt điều kiện, hoặc tìm bằng tên và số điện thoại."
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
        title="Chưa có học sinh"
        description="Tạo hồ sơ đầu tiên để bắt đầu sắp xếp lớp học."
        action={
          <AppButton href="/academic/students/new" size="sm">
            <Plus aria-hidden="true" />
            Thêm học sinh
          </AppButton>
        }
      />
    );
  }

  // The table needs room its six columns cannot give up, so below `lg` the same
  // rows are read as cards instead. Both trees are rendered and one is hidden
  // with `display: none`, which keeps exactly one of them in the accessibility
  // tree without measuring the viewport in JavaScript — a measurement the server
  // cannot make, and so one that would hydrate to the wrong layout.
  return (
    <ResponsiveListView
      view={view}
      table={
        <StudentTable
          rows={state.rows}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
          canUpdate={canUpdate}
          canToggleAccount={canToggleAccount}
        />
      }
      grid={
        <StudentGrid
          state={state}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
          canUpdate={canUpdate}
          canToggleAccount={canToggleAccount}
        />
      }
    />
  );
}

/**
 * Renders the six-column student table, one 72px row per student.
 *
 * The column widths are budgeted from what each column actually holds, not split
 * evenly. Khối holds a 36px token, Tài khoản a ~79px badge, and the action column
 * a 32px button, so each takes only its content plus the 24px of cell padding —
 * measured, not guessed. The slack that frees goes to Phụ huynh, which is the one
 * column whose content genuinely needs it: two chips capped at 142px plus their
 * gaps and the "+N" chip come to 328px, and anything less truncates a surname.
 */
function StudentTable({
  rows,
  onToggleAccount,
  onChangePassword,
  canUpdate,
  canToggleAccount,
}: {
  rows: Student[];
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
  canUpdate: boolean;
  canToggleAccount: boolean;
}) {
  const columns: ListTableColumn<Student>[] = [
    {
      key: "student",
      header: "Học sinh",
      width: 21,
      cell: (student) => <StudentIdentity student={student} />,
    },
    {
      key: "grade",
      header: "Khối",
      width: 5.5,
      cell: (student) => <GradeToken gradeLevel={student.grade_level} />,
    },
    {
      key: "guardians",
      header: "Phụ huynh",
      width: 32,
      cell: (student) => <GuardianTags student={student} />,
    },
    {
      key: "classes",
      header: "Lớp đang học",
      width: 26,
      cell: (student) => <ClassTags student={student} />,
    },
    {
      key: "account",
      header: "Tài khoản",
      width: 10,
      cell: (student) => (
        <StatusBadge status={student.is_account_active !== false ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      width: 5.5,
      cell: (student) => (
        <StudentRowMenu
          student={student}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
          canUpdate={canUpdate}
          canToggleAccount={canToggleAccount}
          className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        />
      ),
    },
  ];

  return (
    <ListTable
      ariaLabel="Danh sách học sinh"
      columns={columns}
      rows={rows}
      rowKey={(student) => student.id}
      minWidth={1120}
    />
  );
}
