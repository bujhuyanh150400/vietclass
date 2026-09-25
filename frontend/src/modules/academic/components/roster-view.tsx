"use client";

import Link from "next/link";
import { Pencil, UserPlus } from "lucide-react";

import { AppButton } from "@/components/shared/app-button";
import {
  DataTablePagination,
  EmptyState,
  ListSkeleton,
  ListTable,
  ListToolbar,
  ResponsiveListView,
  RowActionMenu,
  type DataTableState,
  type ListTableColumn,
  type RowAction,
} from "@/components/shared/data-table";
import { InlineBadge } from "@/components/shared/inline-badge";
import { SelectField } from "@/components/shared/select-field";
import type { PageMeta } from "@/lib/api/contracts";

import type { Enrollment } from "../types/academic";
import { formatDate } from "../utils/labels";

/** What the roster renders and reports back. */
export type RosterViewProps = {
  state: DataTableState<Enrollment>;
  meta: PageMeta;
  search: string;
  canModify: boolean;
  canAdd: boolean;
  rosterTab: "current" | "past";
  hasNote: boolean;
  capacity: number;
  enrolled: number;
  isEnded: boolean;
  onHasNoteChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (enrollment: Enrollment) => void;
  onTransfer: (enrollment: Enrollment) => void;
  onLeave: (enrollment: Enrollment) => void;
};

/**
 * Renders one class roster, including the periods students have already left.
 *
 * History is shown rather than hidden because a student may leave and return, and
 * the earlier period is what makes the gap in their record explainable.
 *
 * Transferring and ending a membership only apply while a period is running, so
 * those entries are offered only on rows that are.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function RosterView({
  state,
  meta,
  search,
  canModify,
  canAdd,
  rosterTab,
  hasNote,
  capacity,
  enrolled,
  isEnded,
  onHasNoteChange,
  onSearchChange,
  onPageChange,
  onAdd,
  onEdit,
  onTransfer,
  onLeave,
}: RosterViewProps) {
  const columns: ListTableColumn<Enrollment>[] = [
    {
      key: "student",
      header: "Học sinh",
      cell: (enrollment) => <StudentIdentity enrollment={enrollment} />,
    },
    {
      key: "period",
      header: "Thời gian học",
      cell: (enrollment) => (
        <span className="text-muted-foreground">
          {formatDate(enrollment.enrolled_at)} –{" "}
          {enrollment.left_at === null ? "Hiện tại" : formatDate(enrollment.left_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: 16,
      cell: (enrollment) => (
        <InlineBadge
          type={enrollment.is_active ? "primary" : "neutral"}
          className="font-sans"
        >
          {enrollment.is_active ? "Đang học" : "Đã nghỉ"}
        </InlineBadge>
      ),
    },
    {
      key: "note",
      header: "Ghi chú",
      width: 24,
      cell: (enrollment) => (
        <span className="whitespace-pre-line text-muted-foreground">
          {enrollment.note ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      width: 8,
      cell: (enrollment) => (
        <EnrollmentActions
          enrollment={enrollment}
          canModify={canModify}
          onEdit={onEdit}
          onTransfer={onTransfer}
          onLeave={onLeave}
        />
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <ListToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm theo tên hoặc mã hồ sơ"
        searchAriaLabel="Tìm theo tên hoặc mã hồ sơ"
        searchPlaceholder="Tên hoặc mã hồ sơ học sinh"
        align="start"
        size="control"
        filters={
          <div className="flex flex-wrap items-end gap-3">
            <SelectField
              name="roster-note-filter"
              label="Lọc danh sách ghi danh"
              value={hasNote ? 1 : 0}
              choices={[
                { value: 0, label: "Tất cả bản ghi" },
                { value: 1, label: "Có ghi chú" },
              ]}
              onChange={(value) => onHasNoteChange(value === 1)}
              size="control"
            />
            <InlineBadge
              type={!isEnded && enrolled >= capacity ? "muted" : "neutral"}
              className="min-h-10 px-3 font-sans text-xs"
              aria-live="polite"
            >
              <strong className="tabular-nums">{enrolled}/{capacity}</strong>
              <span className="text-muted-foreground">{isEnded ? "đã đóng" : enrolled >= capacity ? "đủ sĩ số" : `còn ${Math.max(0, capacity - enrolled)} chỗ`}</span>
            </InlineBadge>
          </div>
        }
        action={
          canModify ? (
            <AppButton onClick={onAdd} disabled={!canAdd} title={canAdd ? undefined : "Lớp đã đủ sĩ số."}>
              <UserPlus aria-hidden="true" />
              {canAdd ? "Thêm học sinh" : "Đã đủ sĩ số"}
            </AppButton>
          ) : null
        }
      />

      {state.kind === "content" ? (
        <ResponsiveListView
          view="table"
          table={
            <ListTable
              ariaLabel="Danh sách học sinh trong lớp"
              columns={columns}
              rows={state.rows}
              rowKey={(enrollment) => enrollment.id}
              minWidth={960}
            />
          }
          grid={
            <div className="grid gap-3">
              {state.rows.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  rosterTab={rosterTab}
                  canModify={canModify}
                  onEdit={onEdit}
                  onTransfer={onTransfer}
                  onLeave={onLeave}
                />
              ))}
            </div>
          }
          mobile={
            <div className="grid gap-3">
              {state.rows.map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  rosterTab={rosterTab}
                  canModify={canModify}
                  onEdit={onEdit}
                  onTransfer={onTransfer}
                  onLeave={onLeave}
                />
              ))}
            </div>
          }
          tableClassName="hidden min-[1025px]:!block"
          mobileClassName="min-[1025px]:!hidden"
        />
      ) : (
        <RosterState state={state} />
      )}

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}

/** Keeps non-content states in the same shared list-state language as redesigned lists. */
function RosterState({
  state,
}: {
  state: Exclude<DataTableState<Enrollment>, { kind: "content" }>;
}) {
  if (state.kind === "loading") {
    return (
      <ListSkeleton
        view="table"
        label="Đang tải danh sách học sinh"
        table={{
          columnTemplate: "minmax(0,1.5fr) minmax(150px,.8fr) minmax(110px,.55fr) minmax(180px,1fr) 48px",
          columnCount: 5,
          rowCount: 5,
        }}
        cardCount={3}
      />
    );
  }

  return (
    <EmptyState
      title={state.message}
      description={state.kind === "empty" ? state.description : undefined}
      action={
        state.kind === "error" && state.onRetry ? (
          <AppButton type="button" variant="outline" onClick={state.onRetry}>
            Thử lại
          </AppButton>
        ) : (
          state.kind === "empty" ? state.action : undefined
        )
      }
      className="py-16"
    />
  );
}

/** Show one compact mobile card with the same period and note data as the table. */
function EnrollmentCard({
  enrollment,
  rosterTab,
  canModify,
  onEdit,
  onTransfer,
  onLeave,
}: {
  enrollment: Enrollment;
  rosterTab: "current" | "past";
  canModify: boolean;
  onEdit: (enrollment: Enrollment) => void;
  onTransfer: (enrollment: Enrollment) => void;
  onLeave: (enrollment: Enrollment) => void;
}) {
  const isPast = rosterTab === "past";

  return (
    <article className="grid gap-3 rounded-panel border border-vc-rule bg-card p-3 shadow-vc-sheet">
      <header className="flex min-w-0 items-start justify-between gap-2">
        <StudentIdentity enrollment={enrollment} />
        <span className="flex shrink-0 items-center gap-1.5">
          <InlineBadge
            type={enrollment.is_active ? "primary" : "neutral"}
            className="font-sans"
          >
            {enrollment.is_active ? "Đang học" : "Đã rời"}
          </InlineBadge>
          <EnrollmentActions
            enrollment={enrollment}
            canModify={canModify}
            onEdit={onEdit}
            onTransfer={onTransfer}
            onLeave={onLeave}
          />
        </span>
      </header>
      <dl className="grid gap-2 border-t border-vc-rule pt-3">
        <div className="grid gap-0.5">
          <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Kỳ ghi danh</dt>
          <dd className="text-xs">
            {isPast ? `Rời lớp · ${formatDate(enrollment.left_at)}` : `Vào lớp · ${formatDate(enrollment.enrolled_at)}`}
            {isPast ? <span className="block text-muted-foreground">Vào lớp · {formatDate(enrollment.enrolled_at)}</span> : null}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{isPast ? "Lý do rời lớp" : "Ghi chú"}</dt>
          <dd className="whitespace-pre-line text-xs text-muted-foreground">{enrollment.note ?? "—"}</dd>
        </div>
      </dl>
    </article>
  );
}

/** Reuse the same server-permitted row actions on desktop and mobile. */
function EnrollmentActions({
  enrollment,
  canModify,
  onEdit,
  onTransfer,
  onLeave,
}: {
  enrollment: Enrollment;
  canModify: boolean;
  onEdit: (enrollment: Enrollment) => void;
  onTransfer: (enrollment: Enrollment) => void;
  onLeave: (enrollment: Enrollment) => void;
}) {
  if (!canModify) return null;

  const actions: RowAction[] = [
    {
      key: "edit",
      label: "Sửa kỳ ghi danh",
      icon: <Pencil aria-hidden="true" className="text-foreground" />,
      onSelect: () => onEdit(enrollment),
    },
    ...(enrollment.is_active
      ? [
          {
            key: "transfer",
            label: "Chuyển lớp",
            onSelect: () => onTransfer(enrollment),
          } satisfies RowAction,
          {
            key: "leave",
            label: "Cho nghỉ lớp",
            variant: "destructive" as const,
            onSelect: () => onLeave(enrollment),
          } satisfies RowAction,
        ]
      : []),
  ];

  return (
    <RowActionMenu
      actions={actions}
      triggerLabel={`Thao tác với ${enrollment.student_name ?? "học sinh"}`}
    />
  );
}

/** Link to the student profile with the compact avatar used by the roster artifact. */
function StudentIdentity({ enrollment }: { enrollment: Enrollment }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-vc-rule bg-vc-tint text-[10px] font-semibold">
        {studentInitials(enrollment.student_name)}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <Link href={`/academic/students/${enrollment.student_id}?tab=classes`} className="truncate font-medium hover:underline">
          {enrollment.student_name ?? "Học sinh"}
        </Link>
        <span className="font-mono text-[10px] text-muted-foreground">Hồ sơ #{enrollment.student_id}</span>
      </span>
    </span>
  );
}

/** Return the last one or two Vietnamese name initials for the roster avatar. */
function studentInitials(name: string | null | undefined): string {
  if (name === null || name === undefined || name.trim() === "") return "?";

  return name.trim().split(/\s+/).slice(-2).map((part) => Array.from(part)[0]?.toLocaleUpperCase("vi") ?? "").join("");
}
