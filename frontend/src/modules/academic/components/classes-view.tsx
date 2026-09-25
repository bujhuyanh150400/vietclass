"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowUpDown,
  Eye,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  ConditionTag,
  ConditionsBar,
  DataTablePagination,
  FilterPopover,
  FilterSection,
  ListSheet,
  ListSkeleton,
  ListTable,
  ListToolbar,
  ResponsiveListView,
  RowActionMenu,
  SortPopover,
  StatePanel,
  ViewPopover,
  type DataTableState,
  type ListTableColumn,
  type RowAction,
  type SortOption,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { PageMeta } from "@/lib/api/contracts";

import type { ClassStatus, GradeLevel, SchoolClass } from "../types/academic";
import {
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  formatDate,
} from "../utils/labels";
import {
  CLASS_TABLE_PAGE_SIZES,
  hasClassConditions,
  type ClassListSort,
  type ClassListView,
} from "../utils/class-list-controls";
import { AppButton } from "@/components/shared/app-button";
import { InlineBadge } from "@/components/shared/inline-badge";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

/** Visible sort choices shared by the toolbar and the removable conditions row. */
const SORT_OPTIONS: SortOption<ClassListSort>[] = [
  { value: "created-desc", label: "Mới tạo gần đây", icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "name-asc", label: "Tên A–Z", icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
  { value: "name-desc", label: "Tên Z–A", icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
  { value: "start-near", label: "Ngày khai giảng gần nhất", icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
];

const SORT_LABELS: Record<ClassListSort, string> = Object.fromEntries(
  SORT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ClassListSort, string>;

/** What the class list screen renders and reports back. */
export type ClassesViewProps = {
  state: DataTableState<SchoolClass>;
  meta: PageMeta;
  search: string;
  statusFilter: ClassStatus | null;
  gradeFilter: GradeLevel | null;
  filterCount: number;
  sort: ClassListSort;
  view: ClassListView;
  tablePageSize: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ClassStatus | null) => void;
  onGradeFilterChange: (value: GradeLevel | null) => void;
  onClearFilters: () => void;
  onSortChange: (value: ClassListSort) => void;
  onViewChange: (value: ClassListView) => void;
  onTablePageSizeChange: (value: number) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onChangeStatus: (schoolClass: SchoolClass) => void;
};

/** Renders the approved class-list heading and one shared ListSheet. */
export function ClassesView({
  state,
  meta,
  search,
  statusFilter,
  gradeFilter,
  filterCount,
  sort,
  view,
  tablePageSize,
  onSearchChange,
  onStatusFilterChange,
  onGradeFilterChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onTablePageSizeChange,
  onClearConditions,
  onPageChange,
  onChangeStatus,
}: ClassesViewProps) {
  const hasConditions = hasClassConditions({
    search,
    status: statusFilter,
    gradeLevel: gradeFilter,
    sort,
  });

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeading
        title="Lớp học"
        badges={
          <InlineBadge>
            <strong className="text-xs text-foreground">{meta.total}</strong> lớp
          </InlineBadge>
        }
        description="Quản lý lớp, môn học, đội ngũ giảng dạy và sĩ số học sinh trong cùng một danh sách."
        action={
          <AppButton href="/academic/classes/new">
            <Plus aria-hidden="true" className="size-[19px]" />
            Tạo lớp học
          </AppButton>
        }
      />

      <ListSheet
        toolbar={
          <ClassListToolbar
            search={search}
            statusFilter={statusFilter}
            gradeFilter={gradeFilter}
            filterCount={filterCount}
            sort={sort}
            view={view}
            onSearchChange={onSearchChange}
            onStatusFilterChange={onStatusFilterChange}
            onGradeFilterChange={onGradeFilterChange}
            onClearFilters={onClearFilters}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
        }
        conditions={
          <ClassConditionsBar
            search={search}
            statusFilter={statusFilter}
            gradeFilter={gradeFilter}
            sort={sort}
            hasConditions={hasConditions}
            onSearchChange={onSearchChange}
            onStatusFilterChange={onStatusFilterChange}
            onGradeFilterChange={onGradeFilterChange}
            onSortChange={onSortChange}
            onClearConditions={onClearConditions}
          />
        }
        pager={
          state.kind === "content" ? (
            <DataTablePagination
              numbered
              unit="lớp"
              meta={meta}
              onPageChange={onPageChange}
              pageSize={view === "table" ? tablePageSize : undefined}
              pageSizeOptions={view === "table" ? CLASS_TABLE_PAGE_SIZES : undefined}
              onPageSizeChange={view === "table" ? onTablePageSizeChange : undefined}
            />
          ) : undefined
        }
      >
        <div aria-busy={state.kind === "loading"}>
          <ClassResults
            state={state}
            hasConditions={hasConditions}
            view={view}
            onClearConditions={onClearConditions}
            onChangeStatus={onChangeStatus}
          />
        </div>
      </ListSheet>
    </div>
  );
}

/** Renders shared search/filter/sort/view controls for the class collection. */
function ClassListToolbar({
  search,
  statusFilter,
  gradeFilter,
  filterCount,
  sort,
  view,
  onSearchChange,
  onStatusFilterChange,
  onGradeFilterChange,
  onClearFilters,
  onSortChange,
  onViewChange,
}: Pick<ClassesViewProps,
  | "search"
  | "statusFilter"
  | "gradeFilter"
  | "filterCount"
  | "sort"
  | "view"
  | "onSearchChange"
  | "onStatusFilterChange"
  | "onGradeFilterChange"
  | "onClearFilters"
  | "onSortChange"
  | "onViewChange"
>) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm tên, mã hoặc ID lớp…"
      searchAriaLabel="Tìm kiếm lớp học"
      searchHelpText="Tìm theo tên, mã hoặc ID lớp. Bỏ dấu tiếng Việt vẫn tìm được."
      align="start"
      size="control"
    >
      <FilterPopover
        compact
        count={filterCount}
        onClear={onClearFilters}
        note="Thay đổi được áp dụng ngay."
      >
        <FilterSection label="Trạng thái">
          <div className="grid grid-cols-3 overflow-hidden rounded-control border border-vc-rule">
            {([
              [null, "Tất cả"],
              [0, classListStatusLabel(0)],
              [1, classListStatusLabel(1)],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={statusFilter === value}
                onClick={() => onStatusFilterChange(value)}
                className="h-8 border-r text-[11px] last:border-r-0 hover:bg-orange-50 aria-pressed:bg-orange-50 aria-pressed:font-medium aria-pressed:text-vc-orange-deep"
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Khối" last>
          <div className="flex flex-wrap gap-1.5">
            {GRADE_LEVELS.map((gradeLevel) => {
              const selected = gradeFilter === gradeLevel;
              const label = GRADE_LEVEL_LABELS[gradeLevel];

              return (
                <button
                  key={gradeLevel}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onGradeFilterChange(selected ? null : gradeLevel)}
                  className="min-h-7 rounded-control border px-2 text-[11px] font-medium transition-colors hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </FilterPopover>

      <SortPopover
        compact
        value={sort}
        options={SORT_OPTIONS}
        onChange={onSortChange}
        isActive={sort !== "created-desc"}
      />

      <ViewPopover
        compact
        value={view}
        onChange={onViewChange}
        note="Dạng thẻ luôn hiển thị 20 lớp mỗi trang."
      />
    </ListToolbar>
  );
}

/** Mirrors each active query condition as a removable chip below the toolbar. */
function ClassConditionsBar({
  search,
  statusFilter,
  gradeFilter,
  sort,
  hasConditions,
  onSearchChange,
  onStatusFilterChange,
  onGradeFilterChange,
  onSortChange,
  onClearConditions,
}: Pick<ClassesViewProps,
  | "search"
  | "statusFilter"
  | "gradeFilter"
  | "sort"
  | "onSearchChange"
  | "onStatusFilterChange"
  | "onGradeFilterChange"
  | "onSortChange"
  | "onClearConditions"
> & { hasConditions: boolean }) {
  return (
    <ConditionsBar
      heading="Điều kiện"
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
      {statusFilter !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Trạng thái"
          label={classListStatusLabel(statusFilter)}
          onRemove={() => onStatusFilterChange(null)}
        />
      ) : null}
      {gradeFilter !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Khối"
          label={GRADE_LEVEL_LABELS[gradeFilter]}
          onRemove={() => onGradeFilterChange(null)}
        />
      ) : null}
      {sort !== "created-desc" ? (
        <ConditionTag
          tone="neutral"
          caption="Sắp xếp"
          label={SORT_LABELS[sort]}
          onRemove={() => onSortChange("created-desc")}
        />
      ) : null}
    </ConditionsBar>
  );
}

/** Renders loading, empty/error states and the responsive table/card fallback. */
function ClassResults({
  state,
  hasConditions,
  view,
  onClearConditions,
  onChangeStatus,
}: {
  state: DataTableState<SchoolClass>;
  hasConditions: boolean;
  view: ClassListView;
  onClearConditions: () => void;
  onChangeStatus: (schoolClass: SchoolClass) => void;
}) {
  if (state.kind === "loading") {
    return (
      <ListSkeleton
        view={view}
        label="Đang tải danh sách lớp"
        table={{
          columnCount: 8,
          columnTemplate: "19fr 15fr 7fr 19fr 12fr 12fr 12fr 4fr",
          rowCount: 5,
          shortCycle: 7,
        }}
        cardCount={4}
        cardGridClassName="grid gap-3 p-3 sm:grid-cols-2"
      />
    );
  }

  if (state.kind === "error") {
    return (
      <StatePanel
        role="alert"
        image="/images/error.webp"
        imageAlt="Chú cú VietClasses bối rối vì tải danh sách lớp thất bại"
        title="Chưa tải được danh sách lớp"
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
        imageAlt="Chú cú VietClasses đang tìm kiếm trong danh sách lớp"
        title="Không tìm thấy lớp học"
        description="Thử đổi từ khóa hoặc xóa bớt điều kiện đang áp dụng."
        action={
          <AppButton size="sm" variant="outline" onClick={onClearConditions}>
            Xóa điều kiện
          </AppButton>
        }
      />
    ) : (
      <StatePanel
        image="/images/empty_1.png"
        imageAlt="Chú cú VietClasses vẫy chào bên danh sách lớp trống"
        title="Chưa có lớp học"
        description="Tạo lớp đầu tiên để bắt đầu quản lý môn học, đội ngũ giảng dạy và sĩ số."
        action={
          <AppButton href="/academic/classes/new" size="sm">
            <Plus aria-hidden="true" />
            Tạo lớp học
          </AppButton>
        }
      />
    );
  }

  return (
    <ResponsiveListView
      view={view}
      tableClassName="hidden min-w-0 lg:block"
      table={<ClassTable rows={state.rows} onChangeStatus={onChangeStatus} />}
      grid={<ClassGrid rows={state.rows} onChangeStatus={onChangeStatus} />}
      mobile={
        <div className="grid gap-3 p-3 md:grid-cols-2">
          {state.rows.map((schoolClass) => (
            <ClassCard key={schoolClass.id} schoolClass={schoolClass} onChangeStatus={onChangeStatus} />
          ))}
        </div>
      }
    />
  );
}

/** Shows the full class-team fields in the compact eight-column sheet. */
function ClassTable({
  rows,
  onChangeStatus,
}: {
  rows: SchoolClass[];
  onChangeStatus: (schoolClass: SchoolClass) => void;
}) {
  const columns: ListTableColumn<SchoolClass>[] = [
    {
      key: "class",
      header: "Lớp học",
      width: 19,
      cell: (schoolClass) => (
        <div className="grid min-w-0 gap-1.5">
          <Link
            href={`/academic/classes/${schoolClass.id}`}
            className="w-fit max-w-full [overflow-wrap:anywhere] text-xs font-semibold hover:underline"
          >
            {schoolClass.name}
          </Link>
          <ClassIdentity code={schoolClass.code} id={schoolClass.id} />
        </div>
      ),
    },
    {
      key: "subjects",
      header: "Môn học",
      width: 15,
      cell: (schoolClass) => <ClassSubjectTags subjects={schoolClass.subjects} compact />,
    },
    {
      key: "grade",
      header: "Khối",
      width: 7,
      cell: (schoolClass) => (
        <InlineBadge
          type="muted"
          className="min-h-7 max-w-full bg-background px-2 font-sans text-[10px] font-semibold [overflow-wrap:anywhere]"
        >
          {GRADE_LEVEL_LABELS[schoolClass.grade_level]}
        </InlineBadge>
      ),
    },
    {
      key: "team",
      header: "Đội ngũ giảng dạy",
      width: 19,
      cell: (schoolClass) => <ClassTeamCell schoolClass={schoolClass} />,
    },
    {
      key: "capacity",
      header: "Sĩ số",
      width: 12,
      cell: (schoolClass) => <ClassCapacity schoolClass={schoolClass} />,
    },
    {
      key: "period",
      header: "Thời gian học",
      width: 12,
      cell: (schoolClass) => (
        <div className="grid gap-1 font-mono text-[10px] leading-[1.4]">
          <time dateTime={schoolClass.start_at ?? undefined}>{formatDate(schoolClass.start_at)}</time>
          <span className="font-sans text-[9px] text-muted-foreground">đến</span>
          <time dateTime={schoolClass.end_at ?? undefined}>{formatDate(schoolClass.end_at)}</time>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: 12,
      cell: (schoolClass) => (
        <StatusBadge
          status={schoolClass.status === 0 ? "active" : "inactive"}
          label={classListStatusLabel(schoolClass.status)}
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      width: 4,
      cell: (schoolClass) => (
        <div className="text-right">
          <ClassActions schoolClass={schoolClass} onChangeStatus={onChangeStatus} />
        </div>
      ),
    },
  ];

  return (
    <ListTable
      ariaLabel="Danh sách lớp học"
      columns={columns}
      rows={rows}
      rowKey={(schoolClass) => schoolClass.id}
      minWidth={1120}
    />
  );
}

/** Renders the explicit card view and the automatic narrow-screen fallback. */
function ClassGrid({
  rows,
  onChangeStatus,
}: {
  rows: SchoolClass[];
  onChangeStatus: (schoolClass: SchoolClass) => void;
}) {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2">
      {rows.map((schoolClass) => (
        <ClassCard key={schoolClass.id} schoolClass={schoolClass} onChangeStatus={onChangeStatus} />
      ))}
    </div>
  );
}

/** Renders the same class facts in a responsive card. */
function ClassCard({
  schoolClass,
  onChangeStatus,
}: {
  schoolClass: SchoolClass;
  onChangeStatus: (schoolClass: SchoolClass) => void;
}) {
  return (
    <article className="grid min-w-0 content-start gap-4 rounded-panel border border-vc-rule bg-card p-3.5 transition-shadow hover:border-vc-control hover:shadow-[0_3px_0_var(--vc-shell-rule)] sm:p-[18px]">
      <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-start gap-2">
        <div className="grid min-w-0 gap-1">
          <Link
            href={`/academic/classes/${schoolClass.id}`}
            className="[overflow-wrap:anywhere] text-base font-semibold leading-tight hover:underline"
          >
            {schoolClass.name}
          </Link>
          <ClassIdentity code={schoolClass.code} id={schoolClass.id} />
        </div>
        <ClassActions schoolClass={schoolClass} onChangeStatus={onChangeStatus} />
      </header>

      <div className="flex flex-wrap gap-2 border-b border-vc-rule pb-3">
        <StatusBadge
          status={schoolClass.status === 0 ? "active" : "inactive"}
          label={classListStatusLabel(schoolClass.status)}
        />
        <InlineBadge
          className="min-h-7 bg-background px-2 font-sans text-[10px] font-semibold"
        >
          {GRADE_LEVEL_LABELS[schoolClass.grade_level]}
        </InlineBadge>
      </div>

      <div className="grid min-w-0 gap-2 border-b border-vc-rule pb-3">
        <span className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
          Môn học · {schoolClass.subjects.length}
        </span>
        <ClassSubjectTags subjects={schoolClass.subjects} />
      </div>

      <div className="border-b border-vc-rule pb-3">
        <ClassTeamCell schoolClass={schoolClass} />
      </div>

      <dl className="grid min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0">
          <dt className="mb-1.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">Sĩ số</dt>
          <dd className="m-0"><ClassCapacity schoolClass={schoolClass} /></dd>
        </div>
        <div className="min-w-0">
          <dt className="mb-1.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">Thời gian học</dt>
          <dd className="m-0 grid gap-1 font-mono text-[10px] leading-[1.4]">
            <time dateTime={schoolClass.start_at ?? undefined}>{formatDate(schoolClass.start_at)}</time>
            <span className="font-sans text-[9px] text-muted-foreground">đến</span>
            <time dateTime={schoolClass.end_at ?? undefined}>{formatDate(schoolClass.end_at)}</time>
          </dd>
        </div>
        <div className="col-span-2 flex items-center justify-between gap-3 border-t border-vc-rule pt-3">
          <span className="text-[10px] font-semibold text-muted-foreground">Khối</span>
          <InlineBadge
            type="muted"
            className="min-h-7 bg-background px-2 font-sans text-[10px] font-semibold"
          >
            {GRADE_LEVEL_LABELS[schoolClass.grade_level]}
          </InlineBadge>
        </div>
      </dl>
    </article>
  );
}

/** Shows no more than two subject chips in a narrow table cell. */
function ClassSubjectTags({
  subjects,
  compact = false,
}: {
  subjects: SchoolClass["subjects"];
  compact?: boolean;
}) {
  const visible = compact ? subjects.slice(0, 2) : subjects;
  const remaining = subjects.length - visible.length;

  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {visible.map((subject) => (
        <InlineBadge
          key={subject.id}
          className="min-h-7 max-w-full bg-card py-1 font-sans text-[10px] font-medium leading-tight [overflow-wrap:anywhere]"
        >
          {subject.name}{subject.is_primary ? " · Chính" : ""}
        </InlineBadge>
      ))}
      {remaining > 0 ? (
        <InlineBadge
          type="muted"
          className="min-h-6 bg-background py-1 text-[10px] font-semibold"
          aria-label={`${remaining} môn học khác: ${subjects.slice(2).map((subject) => subject.name).join(", ")}`}
          title={subjects.slice(2).map((subject) => subject.name).join(", ")}
        >
          +{remaining}
        </InlineBadge>
      ) : null}
    </div>
  );
}

/** Keeps the stable class code and record id together in mono type. */
function ClassIdentity({ code, id }: { code: string; id: number }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1 font-mono text-[10px] leading-[1.35] text-muted-foreground">
      <span className="font-sans font-semibold tracking-wide text-foreground">{code}</span>
      <span aria-hidden="true">· ID</span>
      <span>{id}</span>
    </span>
  );
}

/** Shows hard capacity and current free seats without suggesting an override. */
function ClassCapacity({ schoolClass }: { schoolClass: SchoolClass }) {
  const enrolled = schoolClass.active_students_count ?? 0;
  const capacity = schoolClass.max_students;
  const remaining = Math.max(0, capacity - enrolled);
  const ended = schoolClass.status !== 0;

  return (
    <div className="grid min-w-0 gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-1 text-xs">
        <strong className="font-mono tabular-nums">{enrolled}/{capacity}</strong>
        <span className="text-[9px] text-muted-foreground">đang học</span>
      </div>
      <Progress
        value={capacity > 0 ? (enrolled / capacity) * 100 : 0}
        aria-label={`${enrolled} trên ${capacity} học sinh đang học`}
        className="h-1.5"
      />
      <span className="text-[9px] leading-tight text-muted-foreground">
        {ended
          ? `Đã đóng ${schoolClass.past_enrollments_count ?? 0} kỳ ghi danh`
          : remaining > 0
            ? `Còn ${remaining} chỗ trống`
            : "Đã đủ sĩ số"}
      </span>
    </div>
  );
}

/** Reuses the lead identity and opens the complete assistant roster on demand. */
function ClassTeamCell({ schoolClass }: { schoolClass: SchoolClass }) {
  const [open, setOpen] = useState(false);
  const assistants = schoolClass.assistant_teachers;

  return (
    <div className="grid min-w-0 gap-2">
      <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)] items-center gap-2">
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-control border border-vc-control bg-background text-[9px] font-semibold">
          {teacherInitials(schoolClass.teacher_name)}
        </span>
        <span className="grid min-w-0 gap-0.5">
          <span className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">Phụ trách</span>
          <strong className="[overflow-wrap:anywhere] text-[10px] leading-tight">
            {schoolClass.teacher_name ?? "Chưa phân công"}
          </strong>
        </span>
      </div>

      {assistants.length === 0 ? (
        <span className="pl-9 text-[9px] text-muted-foreground">Chưa có trợ giảng</span>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-[30px] w-fit max-w-full justify-start gap-1.5 rounded-control border-vc-rule px-1.5 text-[9px]"
              aria-label={`Xem ${assistants.length} trợ giảng của ${schoolClass.name}`}
            >
              <span aria-hidden="true" className="flex shrink-0 -space-x-1">
                {assistants.slice(0, 2).map((teacher) => (
                  <span key={teacher.id} className="grid size-[21px] place-items-center rounded-[4px] border border-vc-control bg-background text-[8px] font-semibold">
                    {teacherInitials(teacher.name)}
                  </span>
                ))}
              </span>
              {assistants.length > 2 ? `+${assistants.length}` : assistants.length} trợ giảng
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sheet border-vc-control bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Đội ngũ lớp {schoolClass.code}</DialogTitle>
              <DialogDescription>
                {schoolClass.name} · {assistants.length} trợ giảng đang được phân công.
              </DialogDescription>
            </DialogHeader>
            <ul className="grid gap-2">
              {assistants.map((teacher) => (
                <li key={teacher.id} className="flex items-center justify-between gap-3 rounded-control border border-vc-rule bg-background px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-control border border-vc-control bg-vc-tint text-[10px] font-semibold">
                      {teacherInitials(teacher.name)}
                    </span>
                    <span className="truncate">{teacher.name ?? `Giáo viên #${teacher.id}`}</span>
                  </span>
                  <InlineBadge
                    type={teacher.status === 0 ? "neutral" : "muted"}
                    className="font-sans"
                  >
                    {teacher.status === 0 ? "Đang làm việc" : "Đã nghỉ"}
                  </InlineBadge>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** Reuse view/edit/status actions in both the table and responsive cards. */
function ClassActions({
  schoolClass,
  onChangeStatus,
}: {
  schoolClass: SchoolClass;
  onChangeStatus: (schoolClass: SchoolClass) => void;
}) {
  const actions: RowAction[] = [
    {
      key: "view",
      label: "Xem lớp và học sinh",
      icon: <Eye aria-hidden="true" className="text-foreground" />,
      href: `/academic/classes/${schoolClass.id}`,
    },
    {
      key: "edit",
      label: "Sửa lớp",
      icon: <Pencil aria-hidden="true" className="text-foreground" />,
      href: `/academic/classes/${schoolClass.id}/edit`,
    },
    {
      key: "status",
      label: schoolClass.status === 0 ? "Kết thúc lớp" : "Mở lại lớp",
      icon: schoolClass.status === 0 ? (
        <LockKeyhole aria-hidden="true" className="text-foreground" />
      ) : (
        <RefreshCw aria-hidden="true" className="text-foreground" />
      ),
      onSelect: () => onChangeStatus(schoolClass),
    },
  ];

  return (
    <RowActionMenu
      actions={actions}
      triggerLabel={`Thao tác với ${schoolClass.name}`}
    />
  );
}


function classListStatusLabel(status: ClassStatus): string {
  return status === 0 ? "Đang hoạt động" : "Đã kết thúc";
}

/** Builds a compact, safe initials label for a teacher avatar. */
function teacherInitials(name: string | null | undefined): string {
  if (name === null || name === undefined || name.trim() === "") return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("vi") ?? "")
    .join("");
}
