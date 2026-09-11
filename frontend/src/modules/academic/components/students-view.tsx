"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

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

import type { Student } from "../types/academic";
import {
  STUDENT_TABLE_PAGE_SIZES,
  type StudentFilterState,
  type StudentListSort,
  type StudentListView,
} from "../utils/student-list-controls";
import {
  AccountBadge,
  GradeToken,
  StudentIdentity,
  StudentRowMenu,
} from "./student-cells";
import { ClassTags, GuardianTags } from "./student-entity-tags";
import { StudentGrid } from "./student-grid";
import { StudentListSkeleton } from "./student-list-skeleton";
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
}: StudentsViewProps) {
  const hasConditions = hasStudentConditions({ search, filterCount, sort });

  return (
    <div className="grid gap-6">
      <StudentsHeading total={meta.total} />

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
          hasConditions ? (
            <StudentConditionsBar
              search={search}
              filters={filters}
              sort={sort}
              onSearchChange={onSearchChange}
              onToggleGradeLevel={onToggleGradeLevel}
              onAccountActiveChange={onAccountActiveChange}
              onSortChange={onSortChange}
              onClearConditions={onClearConditions}
            />
          ) : undefined
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
            view={view}
          />
        </div>
      </ListSheet>
    </div>
  );
}

/**
 * Renders the screen's title block: what this screen is, how many records it
 * holds, and the one action that adds another.
 *
 * The count sits beside the title rather than in the pager because it answers a
 * question about the whole collection, not about the page being read.
 */
function StudentsHeading({ total }: { total: number }) {
  return (
    <div className="flex items-start justify-between gap-3 md:items-end">
      <div>
        <div className="flex flex-col md:flex-row md:items-end md:gap-4">
          {/*
            An `h2`, not an `h1`: the topbar already carries the page's `h1` on
            every protected screen, and taking that away to promote this one left
            the screens that have no title of their own with no heading at all.
          */}
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
            Học sinh
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-muted-foreground md:mt-0 md:mb-1.5">
            <strong className="font-mono text-[15px] text-foreground">{total}</strong> hồ sơ
          </p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
          Quản lý hồ sơ, liên hệ gia đình và lớp đang theo học.
        </p>
      </div>

      {/*
        The screen's one primary action wears the design system's pressable
        treatment: a wood edge and a solid 3px offset beneath it, so it reads as a
        key that can be pressed rather than a painted rectangle. It matches the
        toolbar controls' 44px height, since the two rows are read together.
      */}
      <Button
        asChild
        className="h-11 gap-2 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px] max-md:has-[>svg]:px-3"
      >
        <Link href="/academic/students/new">
          {/*
            The size sits on the icon rather than the button: the Button variant
            sizes icons through `[&_svg:not([class*='size-'])]`, so a class on the
            svg itself is what opts out of the 16px default.
          */}
          <Plus aria-hidden="true" className="size-[19px]" />
          <span className="max-md:sr-only">Thêm học sinh</span>
        </Link>
      </Button>
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
}: {
  state: DataTableState<Student>;
  hasConditions: boolean;
  view: StudentListView;
  onClearConditions: () => void;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
}) {
  if (state.kind === "loading") {
    return <StudentListSkeleton />;
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
        title="Không tìm thấy kết quả"
        description="Thử bỏ bớt điều kiện, hoặc tìm bằng tên và số điện thoại."
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
        title="Chưa có học sinh"
        description="Tạo hồ sơ đầu tiên để bắt đầu sắp xếp lớp học."
        action={
          <Button asChild size="sm">
            <Link href="/academic/students/new">
              <Plus aria-hidden="true" />
              Thêm học sinh
            </Link>
          </Button>
        }
      />
    );
  }

  // The table needs room its six columns cannot give up, so below `lg` the same
  // rows are read as cards instead. Both trees are rendered and one is hidden
  // with `display: none`, which keeps exactly one of them in the accessibility
  // tree without measuring the viewport in JavaScript — a measurement the server
  // cannot make, and so one that would hydrate to the wrong layout.
  if (view === "grid") {
    return (
      <StudentGrid
        state={state}
        onToggleAccount={onToggleAccount}
        onChangePassword={onChangePassword}
      />
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <StudentTable
          rows={state.rows}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
        />
      </div>
      <div className="lg:hidden">
        <StudentGrid
          state={state}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
        />
      </div>
    </>
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
}: {
  rows: Student[];
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
}) {
  // One min-width at every size the table is shown at. A narrower variant was
  // tried for the 1024–1279 band and had to go: at 980px the guardian column
  // cannot hold two full chips plus the overflow counter, so names lost their last
  // word — the column exists to tell you who to call, and a surname is the part
  // worth keeping. The band scrolls horizontally instead, which it already did,
  // and below 1024px the cards take over entirely.
  return (
    <Table className="min-w-[1120px] table-fixed">
      <colgroup>
        <col className="w-[21%]" />
        <col className="w-[5.5%]" />
        <col className="w-[32%]" />
        <col className="w-[26%]" />
        <col className="w-[10%]" />
        <col className="w-[5.5%]" />
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent [&_th]:border-b [&_th]:border-vc-rule">
          <TableHead className="px-3 text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
            Học sinh
          </TableHead>
          <TableHead className="px-3 text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
            Khối
          </TableHead>
          <TableHead className="px-3 text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
            Phụ huynh
          </TableHead>
          <TableHead className="px-3 text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
            Lớp đang học
          </TableHead>
          <TableHead className="px-3 text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
            Tài khoản
          </TableHead>
          <TableHead className="px-3">
            <span className="sr-only">Thao tác</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((student) => (
          <TableRow
            key={student.id}
            className="group border-vc-rule hover:bg-vc-tint focus-within:bg-vc-tint has-aria-expanded:bg-vc-tint [&_td]:h-[72px] [&_td]:px-3"
          >
            <TableCell>
              <StudentIdentity student={student} />
            </TableCell>
            <TableCell>
              <GradeToken gradeLevel={student.grade_level} />
            </TableCell>
            <TableCell>
              <GuardianTags student={student} />
            </TableCell>
            <TableCell>
              <ClassTags student={student} />
            </TableCell>
            <TableCell>
              <AccountBadge isActive={student.is_account_active !== false} />
            </TableCell>
            <TableCell>
              <StudentRowMenu
                student={student}
                onToggleAccount={onToggleAccount}
                onChangePassword={onChangePassword}
                className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
