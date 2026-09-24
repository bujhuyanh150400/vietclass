"use client";

import { useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BackLink } from "@/components/shared/back-link";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ResourceLoader } from "@/components/shared/resource-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClassSummary } from "../components/class-summary";
import { RosterView } from "../components/roster-view";
import { useChangeClassStatus, useClass } from "../hooks/use-classes";
import {
  useEnrollmentList,
  useLeaveClass,
  useTransferEnrollment,
  useUpdateEnrollment,
} from "../hooks/use-enrollments";
import type { ClassStatus, Enrollment, SchoolClass } from "../types/academic";
import { GRADE_LEVEL_LABELS, formatDate } from "../utils/labels";
import { classDetailTab, classRosterTab } from "../utils/detail-tab-state";
import { AddStudentsDialog } from "./add-students-dialog";
import {
  EditEnrollmentDialog,
  LeaveClassDialog,
  TransferEnrollmentDialog,
} from "./enrollment-dialogs";

/** Which enrolment dialog, if any, is open and for which membership period. */
type OpenDialog =
  | { kind: "none" }
  | { kind: "add" }
  | { kind: "edit"; enrollment: Enrollment }
  | { kind: "transfer"; enrollment: Enrollment }
  | { kind: "leave"; enrollment: Enrollment };

/** Loads one class and its URL-addressable four-tab detail screen. */
export function ClassDetailContainer({ classId }: { classId: number }) {
  const query = useClass(classId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy lớp học.">
      {(schoolClass) => <ClassDetail schoolClass={schoolClass} />}
    </ResourceLoader>
  );
}

/** Coordinate the class overview, roster filters, and the actions the API permits. */
function ClassDetail({ schoolClass }: { schoolClass: SchoolClass }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = classDetailTab(searchParams.get("tab"));
  const rosterTab = classRosterTab(searchParams.get("roster"));
  const roster = useEnrollmentList(schoolClass.id, rosterTab);
  const updateEnrollment = useUpdateEnrollment();
  const transfer = useTransferEnrollment();
  const leave = useLeaveClass();
  const changeStatus = useChangeClassStatus();
  const [dialog, setDialog] = useState<OpenDialog>({ kind: "none" });
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const canModify = schoolClass.status === 0;
  const enrolled = schoolClass.active_students_count ?? 0;
  const remaining = Math.max(0, schoolClass.max_students - enrolled);
  const close = () => setDialog({ kind: "none" });

  /** Preserve search, pagination, and other state while changing a detail tab. */
  function setQueryValue(key: "tab" | "roster", value: string, defaultValue: string): void {
    const next = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    if (key === "roster") next.delete("page");

    const query = next.toString();
    router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
  }

  /** Close a class atomically after spelling out its effect on running enrollments. */
  async function confirmClassStatus(): Promise<void> {
    setStatusError(null);

    try {
      await changeStatus.mutateAsync({
        id: schoolClass.id,
        status: (schoolClass.status === 0 ? 1 : 0) as ClassStatus,
      });
      setConfirmStatus(false);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Không thực hiện được thao tác này.");
    }
  }

  return (
    <div className="grid gap-[22px]">
      <BackLink href="/academic/classes" label="Danh sách lớp học" />

      <header className="flex flex-col gap-3 min-[1025px]:flex-row min-[1025px]:items-end min-[1025px]:justify-between">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Sổ lớp</span>
          </div>
          <h2 className="mt-1 text-[clamp(27px,3.1vw,37px)] leading-[1.16] font-semibold tracking-tight">
            {schoolClass.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{schoolClass.code}</span>
            <span aria-hidden="true">·</span>
            <span>{GRADE_LEVEL_LABELS[schoolClass.grade_level]}</span>
            <span aria-hidden="true">·</span>
            <Badge variant={canModify ? "default" : "secondary"}>
              {canModify ? "Đang hoạt động" : "Đã kết thúc"}
            </Badge>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {schoolClass.subjects.map((subject) => (
              <Badge key={subject.id} variant={subject.is_primary ? "default" : "secondary"}>
                {subject.name}{subject.is_primary ? " · Chính" : ""}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 md:w-auto min-[1025px]:justify-end">
          <Button className="min-h-[38px] max-md:!flex-1" type="button" variant={canModify ? "outline" : "default"} onClick={() => {
            setStatusError(null);
            setConfirmStatus(true);
          }}>
            {canModify ? "Kết thúc lớp" : "Mở lại lớp"}
          </Button>
          <Button className="min-h-[38px] max-md:!flex-1" asChild variant="outline">
            <Link href={`/academic/classes/${schoolClass.id}/edit`}>Sửa lớp</Link>
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setQueryValue("tab", value, "overview")}
        className="min-w-0 gap-5"
      >
        <TabsList
          variant="default"
          aria-label="Nội dung lớp học"
          className="!h-14 flex w-full justify-start gap-1 overflow-x-auto rounded-control border border-vc-control bg-vc-tint p-[5px] shadow-[0_2px_0_var(--vc-shell-rule)]"
        >
          <TabsTrigger value="overview" className="!h-11 min-h-11 min-w-max flex-[0_0_auto] whitespace-nowrap px-3 text-xs font-semibold data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[0_2px_0_var(--vc-wood)] sm:!flex-1">Tổng quan</TabsTrigger>
          <TabsTrigger value="students" className="!h-11 min-h-11 min-w-max flex-[0_0_auto] whitespace-nowrap px-3 text-xs font-semibold data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[0_2px_0_var(--vc-wood)] sm:!flex-1">
            <span>Học sinh</span>
            <span className="ml-1 rounded border border-current px-1.5 py-0.5 text-[10px] leading-none">
              {enrolled}/{schoolClass.max_students}
            </span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="!h-11 min-h-11 min-w-max flex-[0_0_auto] whitespace-nowrap px-3 text-xs font-semibold data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[0_2px_0_var(--vc-wood)] sm:!flex-1">
            Lịch cố định <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[9px]">Sắp có</Badge>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="!h-11 min-h-11 min-w-max flex-[0_0_auto] whitespace-nowrap px-3 text-xs font-semibold data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-[0_2px_0_var(--vc-wood)] sm:!flex-1">
            Lịch sử buổi học <Badge variant="outline" className="ml-1 px-1.5 py-0 text-[9px]">Sắp có</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 outline-none">
          <ClassSummary
            schoolClass={schoolClass}
            onGoStudents={() => setQueryValue("tab", "students", "overview")}
          />
        </TabsContent>

        <TabsContent value="students" className="mt-0 outline-none">
          <Tabs
            value={rosterTab}
            onValueChange={(value) => setQueryValue("roster", value, "current")}
            className="min-w-0 gap-0"
          >
            <TabsList variant="line" aria-label="Trạng thái ghi danh" className="!h-[53px] flex w-full justify-start gap-6 overflow-x-auto border-b border-vc-rule px-5 py-0 max-sm:px-3">
              <TabsTrigger value="current" className="min-h-[52px] flex-none px-0 text-xs font-semibold whitespace-nowrap">
                Đang học <span className="ml-1 text-xs">{enrolled}</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="min-h-[52px] flex-none px-0 text-xs font-semibold whitespace-nowrap">
                Đã rời <span className="ml-1 text-xs">{schoolClass.past_enrollments_count ?? 0}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={rosterTab} className="mt-0 outline-none">
              <RosterView
                state={roster.state}
                meta={roster.meta}
                search={roster.query.q}
                canModify={canModify}
                canAdd={canModify && remaining > 0}
                rosterTab={rosterTab}
                hasNote={roster.hasNote}
                capacity={schoolClass.max_students}
                enrolled={enrolled}
                isEnded={!canModify}
                onHasNoteChange={(value) => {
                  roster.setHasNote(value);
                  roster.query.setPage(1);
                }}
                onSearchChange={roster.query.setSearch}
                onPageChange={roster.query.setPage}
                onAdd={() => setDialog({ kind: "add" })}
                onEdit={(enrollment) => setDialog({ kind: "edit", enrollment })}
                onTransfer={(enrollment) => setDialog({ kind: "transfer", enrollment })}
                onLeave={(enrollment) => setDialog({ kind: "leave", enrollment })}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="schedule" className="mt-0 outline-none">
          <ClassPhasePlaceholder kind="schedule" />
        </TabsContent>

        <TabsContent value="sessions" className="mt-0 outline-none">
          <ClassPhasePlaceholder kind="sessions" />
        </TabsContent>
      </Tabs>

      <AddStudentsDialog
        classId={schoolClass.id}
        open={dialog.kind === "add"}
        onOpenChange={(open) => (open ? setDialog({ kind: "add" }) : close())}
        capacityHint={`Còn ${remaining} chỗ trong lớp (${enrolled}/${schoolClass.max_students}). Cả nhóm được thêm cùng một ngày.`}
      />

      {dialog.kind === "edit" ? (
        <EditEnrollmentDialog
          enrollment={dialog.enrollment}
          onClose={close}
          submit={(body) => updateEnrollment.mutateAsync({ id: dialog.enrollment.id, body })}
        />
      ) : null}

      {dialog.kind === "transfer" ? (
        <TransferEnrollmentDialog
          enrollment={dialog.enrollment}
          onClose={close}
          submit={(body) => transfer.mutateAsync({ id: dialog.enrollment.id, body })}
        />
      ) : null}

      {dialog.kind === "leave" ? (
        <LeaveClassDialog
          enrollment={dialog.enrollment}
          onClose={close}
          submit={(body) => leave.mutateAsync({ id: dialog.enrollment.id, body })}
        />
      ) : null}

      <ConfirmActionDialog
        open={confirmStatus}
        onOpenChange={(open) => {
          setConfirmStatus(open);
          if (!open) setStatusError(null);
        }}
        title={canModify ? "Kết thúc lớp học?" : "Mở lại lớp học?"}
        description={canModify
          ? `Lớp "${schoolClass.name}" sẽ kết thúc và ${enrolled} học sinh đang học sẽ được cho nghỉ theo ngày ${formatDate(schoolClass.end_at ?? new Date().toISOString().slice(0, 10))}. Mở lại lớp sau đó không khôi phục danh sách.`
          : `Lớp "${schoolClass.name}" sẽ hoạt động trở lại. Các kỳ đã đóng không được tự khôi phục; cần thêm lại học sinh.`}
        confirmLabel={canModify ? "Kết thúc lớp" : "Mở lại"}
        destructive={canModify}
        errorMessage={statusError}
        isPending={changeStatus.isPending}
        onConfirm={() => void confirmClassStatus()}
      />
    </div>
  );
}

/** Be explicit that schedules and meeting attendance are not stored yet. */
function ClassPhasePlaceholder({ kind }: { kind: "schedule" | "sessions" }) {
  const schedule = kind === "schedule";
  const Icon = schedule ? CalendarDays : Clock3;

  return (
    <Card>
      <CardContent className="grid justify-items-center gap-4 px-5 py-10 text-center sm:py-14">
        <span className="grid size-12 place-items-center rounded-full border border-vc-rule bg-vc-tint text-muted-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="grid max-w-xl gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h3 className="text-lg font-semibold">
              {schedule ? "Lịch cố định chưa có trong giai đoạn này" : "Lịch sử buổi học chưa có trong giai đoạn này"}
            </h3>
            <Badge variant="secondary">Sắp có</Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {schedule
              ? "Lịch học lặp lại theo tuần, gán phòng học và kiểm tra trùng lịch thuộc giai đoạn sau. Lớp hiện chưa lưu dữ liệu lịch nào, nên không có thời khóa biểu hay phòng nào được hiển thị ở đây."
              : "Buổi học, điểm danh và nhận xét theo buổi thuộc giai đoạn sau. Hệ thống chưa ghi nhận buổi học nào cho lớp này, nên không có số liệu chuyên cần để hiển thị."}
          </p>
          <ul className="grid gap-1 text-left text-xs leading-relaxed text-muted-foreground">
            {schedule ? (
              <>
                <li>Không có khung giờ, phòng học hay giáo viên theo buổi nào được tạo.</li>
                <li>Không có thao tác nào trong tab này cho tới khi tính năng được triển khai.</li>
              </>
            ) : (
              <>
                <li>Chưa có buổi học, chưa có điểm danh hay nhận xét.</li>
                <li>Lịch sử ghi danh của từng học sinh xem ở hồ sơ học sinh, tab Lớp học.</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
