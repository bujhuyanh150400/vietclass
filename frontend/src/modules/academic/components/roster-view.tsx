"use client";

import Link from "next/link";
import { MoreHorizontal, UserPlus } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableState,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/shared/select-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const columns: DataTableColumn<Enrollment>[] = [
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
      className: "w-32",
      cell: (enrollment) => (
        <Badge variant={enrollment.is_active ? "default" : "secondary"}>
          {enrollment.is_active ? "Đang học" : "Đã nghỉ"}
        </Badge>
      ),
    },
    {
      key: "note",
      header: "Ghi chú",
      hideOnMobile: true,
      cell: (enrollment) => (
        <span className="whitespace-pre-line text-muted-foreground">
          {enrollment.note ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
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
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm theo tên hoặc mã hồ sơ"
        searchPlaceholder="Tên hoặc mã hồ sơ học sinh"
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
            <span className={`inline-flex min-h-10 items-center gap-1.5 rounded-control border px-3 text-xs ${!isEnded && enrolled >= capacity ? "border-vc-control bg-vc-tint" : "border-vc-rule bg-card"}`} aria-live="polite">
              <strong className="tabular-nums">{enrolled}/{capacity}</strong>
              <span className="text-muted-foreground">{isEnded ? "đã đóng" : enrolled >= capacity ? "đủ sĩ số" : `còn ${Math.max(0, capacity - enrolled)} chỗ`}</span>
            </span>
          </div>
        }
        action={
          canModify ? (
            <Button onClick={onAdd} disabled={!canAdd} title={canAdd ? undefined : "Lớp đã đủ sĩ số."}>
              <UserPlus aria-hidden="true" />
              {canAdd ? "Thêm học sinh" : "Đã đủ sĩ số"}
            </Button>
          ) : null
        }
      />

      {state.kind === "content" ? (
        <>
          <div className="hidden min-[1025px]:!block">
            <DataTable columns={columns} state={state} rowKey={(enrollment) => enrollment.id} />
          </div>
          <div className="grid gap-3 min-[1025px]:!hidden">
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
        </>
      ) : (
        <DataTable columns={columns} state={state} rowKey={(enrollment) => enrollment.id} />
      )}

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
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
          <Badge variant={enrollment.is_active ? "default" : "secondary"}>
            {enrollment.is_active ? "Đang học" : "Đã rời"}
          </Badge>
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Thao tác với ${enrollment.student_name ?? "học sinh"}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(enrollment)}>Sửa kỳ ghi danh</DropdownMenuItem>
        {enrollment.is_active ? (
          <>
            <DropdownMenuItem onSelect={() => onTransfer(enrollment)}>Chuyển lớp</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onLeave(enrollment)}>
              Cho nghỉ lớp
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
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
