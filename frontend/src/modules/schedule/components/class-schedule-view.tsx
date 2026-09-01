"use client";

import { CalendarPlus, MoreHorizontal } from "lucide-react";

import {
  DataTable,
  type DataTableColumn,
  type DataTableState,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ScheduleTemplate } from "../types/schedule";
import {
  DAY_OF_WEEK_LABELS,
  SCHEDULE_STATE_LABELS,
  SCHEDULE_TEACHER_ROLE_LABELS,
  formatAssistantTeachers,
  formatEffectiveRange,
  formatTimeRange,
  scheduleEffectiveState,
} from "../utils/labels";

/** What the fixed-schedule section renders and reports back. */
export type ClassScheduleViewProps = {
  state: DataTableState<ScheduleTemplate>;
  /** Whether the signed-in role may change a schedule, resolved by the container. */
  canWrite: boolean;
  onAdd: () => void;
  onRevise: (template: ScheduleTemplate) => void;
  onChangeTeachers: (template: ScheduleTemplate) => void;
  onClose: (template: ScheduleTemplate) => void;
  onDelete: (template: ScheduleTemplate) => void;
};

/**
 * Renders the fixed schedules of one class: every weekly slot in weekday then time
 * order, the people teaching it, and the date range it applies over.
 *
 * Slots that have already ended stay in the table on purpose. Editing a fixed
 * schedule never overwrites it — it closes the running version and opens a new one
 * — so the finished rows are the class's schedule history, and hiding them would
 * make a perfectly ordinary revision look like data that went missing. The notice
 * above the table says this in as many words, because a reader who has not been
 * told will read the extra row as a mistake.
 *
 * No action is offered on a finished row: it describes weeks that have already been
 * taught, and the API refuses to rewrite them.
 *
 * A role without write permission — a teacher, who may read this table but whose
 * every write is refused with `403` — gets the table and nothing else: no add
 * button and no actions column at all, rather than a column of empty cells.
 *
 * Presentational: the container supplies the resolved view model and every event
 * callback, so this component owns no queries, mutations, or navigation state.
 * `canWrite` arrives the same way — reading the role is the container's job.
 */
export function ClassScheduleView({
  state,
  canWrite,
  onAdd,
  onRevise,
  onChangeTeachers,
  onClose,
  onDelete,
}: ClassScheduleViewProps) {
  const columns: DataTableColumn<ScheduleTemplate>[] = [
    {
      key: "day_of_week",
      header: "Thứ",
      className: "w-24",
      cell: (template) => (
        <span className="font-medium">{DAY_OF_WEEK_LABELS[template.day_of_week]}</span>
      ),
    },
    {
      key: "time",
      header: "Khung giờ",
      className: "w-32",
      cell: (template) => (
        <span className="tabular-nums">
          {formatTimeRange(template.start_time, template.end_time)}
        </span>
      ),
    },
    {
      key: "room",
      header: "Phòng học",
      className: "w-32",
      cell: (template) => <span>{template.room_name ?? `#${template.room_id}`}</span>,
    },
    {
      key: "main_teacher",
      header: SCHEDULE_TEACHER_ROLE_LABELS[0],
      cell: (template) => (
        <span>{template.main_teacher?.teacher_name ?? "—"}</span>
      ),
    },
    {
      key: "assistant_teachers",
      header: SCHEDULE_TEACHER_ROLE_LABELS[1],
      hideOnMobile: true,
      cell: (template) => (
        <span className="text-muted-foreground">{formatAssistantTeachers(template)}</span>
      ),
    },
    {
      key: "effective_range",
      header: "Khoảng hiệu lực",
      hideOnMobile: true,
      cell: (template) => (
        <span className="text-muted-foreground">{formatEffectiveRange(template)}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-32",
      cell: (template) => {
        const status = scheduleEffectiveState(template);

        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {SCHEDULE_STATE_LABELS[status]}
          </Badge>
        );
      },
    },
  ];

  if (canWrite) {
    columns.push({
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (template) =>
        scheduleEffectiveState(template) === "ended" ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Thao tác với lịch ${DAY_OF_WEEK_LABELS[template.day_of_week]} ${formatTimeRange(template.start_time, template.end_time)}`}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onRevise(template)}>
                Sửa lịch (ra bản mới)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChangeTeachers(template)}>
                Đổi giáo viên
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onClose(template)}>Đóng lịch</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(template)}>
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    });
  }

  return (
    <section aria-labelledby="class-schedule-heading" className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <h2 id="class-schedule-heading" className="text-lg font-semibold tracking-tight">
            Lịch cố định
          </h2>
          <p className="text-sm text-muted-foreground">
            Lớp này học vào thứ mấy, giờ nào, ở phòng nào và ai dạy. Mỗi buổi trong tuần là một
            dòng.
          </p>
        </div>
        {canWrite ? (
          <Button onClick={onAdd}>
            <CalendarPlus aria-hidden="true" />
            Thêm lịch cố định
          </Button>
        ) : null}
      </div>

      <p className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Sửa một lịch cố định không ghi đè lên lịch cũ. Hệ thống <strong>đóng bản đang chạy</strong>{" "}
        vào ngày liền trước ngày hiệu lực và <strong>mở một bản mới</strong> từ ngày hiệu lực. Vì
        vậy bảng dưới đây giữ cả những bản đã kết thúc — đó là lịch sử đổi lịch của lớp, không phải
        dữ liệu thừa.
      </p>

      <DataTable columns={columns} state={state} rowKey={(template) => template.id} />
    </section>
  );
}
