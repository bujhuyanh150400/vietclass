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
import { TeacherListSkeleton } from "./teacher-list-skeleton";

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
      <TeachersHeading total={meta.total} />

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
          conditions ? (
            <TeacherConditionsBar
              search={search}
              filters={filters}
              sort={sort}
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
          ) : undefined
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

function TeachersHeading({ total }: { total: number }) {
  return (
    <div className="flex items-start justify-between gap-3 md:items-end">
      <div>
        <div className="flex flex-col md:flex-row md:items-end md:gap-4">
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
            Giáo viên
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-muted-foreground md:mt-0 md:mb-1.5">
            <strong className="font-mono text-[15px] text-foreground">{total}</strong> hồ sơ
          </p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
          Quản lý hồ sơ, tài khoản và các lớp giáo viên đang phụ trách.
        </p>
      </div>

      <Button
        asChild
        className="h-11 gap-2 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px] max-md:has-[>svg]:px-3"
      >
        <Link href="/academic/teachers/new">
          <Plus aria-hidden="true" className="size-[19px]" />
          <span className="max-md:sr-only">Thêm giáo viên</span>
        </Link>
      </Button>
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
    return <TeacherListSkeleton />;
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
        title="Không tìm thấy giáo viên phù hợp"
        description="Thử đổi từ khóa hoặc xóa bớt điều kiện lọc."
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
        title="Chưa có giáo viên"
        description="Thêm giáo viên đầu tiên để bắt đầu phân công lớp."
        action={
          <Button asChild size="sm">
            <Link href="/academic/teachers/new">
              <Plus aria-hidden="true" />
              Thêm giáo viên
            </Link>
          </Button>
        }
      />
    );
  }

  if (view === "grid") {
    return (
      <TeacherGrid
        state={state}
        onView={onViewTeacher}
        onToggleAccount={onToggleAccount}
        onChangePassword={onChangePassword}
      />
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <TeacherTable
          rows={state.rows}
          sort={sort}
          onSortChange={onSortChange}
          onView={onViewTeacher}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
        />
      </div>
      <div className="lg:hidden">
        <TeacherGrid
          state={state}
          onView={onViewTeacher}
          onToggleAccount={onToggleAccount}
          onChangePassword={onChangePassword}
        />
      </div>
    </>
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
  return (
    <Table
      aria-label="Danh sách giáo viên"
      className="min-w-[1120px] table-fixed min-[1200px]:min-w-[1240px]"
    >
      <colgroup>
        <col className="w-[22%]" />
        <col className="w-[16%]" />
        <col className="w-[16%]" />
        <col className="w-[18%]" />
        <col className="w-[14%]" />
        <col className="w-[10%]" />
        <col className="w-[4%]" />
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent [&_th]:border-b [&_th]:border-vc-rule [&_th]:px-3 [&_th]:text-[11px] [&_th]:tracking-[0.06em] [&_th]:text-muted-foreground [&_th]:uppercase">
          <TableHead aria-sort={teacherSortDirection(sort, "name")}>
            <SortableTeacherHead
              label="Giáo viên"
              active={sort.startsWith("name-")}
              onClick={() => onSortChange(nextNameSort(sort))}
            />
          </TableHead>
          <TableHead>Liên hệ</TableHead>
          <TableHead>Bộ môn</TableHead>
          <TableHead>Lớp phụ trách</TableHead>
          <TableHead>Tài khoản</TableHead>
          <TableHead aria-sort={teacherSortDirection(sort, "date")}>
            <SortableTeacherHead
              label="Ngày tham gia"
              active={sort === "newest" || sort === "date-asc"}
              onClick={() => onSortChange(nextDateSort(sort))}
            />
          </TableHead>
          <TableHead>
            <span className="sr-only">Thao tác</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((teacher) => (
          <TableRow
            key={teacher.id}
            className="group border-vc-rule whitespace-normal hover:bg-vc-tint focus-within:bg-vc-tint has-aria-expanded:bg-vc-tint [&_td]:h-[76px] [&_td]:px-3"
          >
            <TableCell>
              <TeacherIdentity teacher={teacher} onView={onView} />
            </TableCell>
            <TableCell>
              <TeacherContact teacher={teacher} />
            </TableCell>
            <TableCell>
              <TeacherSubjects teacher={teacher} />
            </TableCell>
            <TableCell>
              <TeacherClasses teacher={teacher} />
            </TableCell>
            <TableCell>
              <TeacherAccountBadge teacher={teacher} />
            </TableCell>
            <TableCell>
              <TeacherJoinedDate teacher={teacher} />
            </TableCell>
            <TableCell>
              <TeacherRowMenu
                teacher={teacher}
                onView={onView}
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
