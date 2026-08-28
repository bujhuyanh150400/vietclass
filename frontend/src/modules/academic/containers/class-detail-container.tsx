"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ClassSummary } from "../components/class-summary";
import { ResourceLoader } from "../components/resource-loader";
import { RosterView } from "../components/roster-view";
import { useClass } from "../hooks/use-classes";
import {
  useEnrollmentList,
  useLeaveClass,
  useTransferEnrollment,
  useUpdateEnrollment,
} from "../hooks/use-enrollments";
import type { Enrollment, SchoolClass } from "../types/academic";
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

/**
 * Loads one class, then shows its facts above its roster.
 */
export function ClassDetailContainer({ classId }: { classId: number }) {
  const query = useClass(classId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy lớp học.">
      {(schoolClass) => <ClassDetail schoolClass={schoolClass} />}
    </ResourceLoader>
  );
}

/**
 * Coordinates everything that can be done to one class's roster: adding students,
 * correcting a period, transferring, and ending a membership.
 *
 * Every action is hidden once the class has finished, because the API refuses all
 * of them then, and offering a control that can only fail is worse than not
 * offering it at all.
 */
function ClassDetail({ schoolClass }: { schoolClass: SchoolClass }) {
  const roster = useEnrollmentList(schoolClass.id);
  const updateEnrollment = useUpdateEnrollment();
  const transfer = useTransferEnrollment();
  const leave = useLeaveClass();

  const [dialog, setDialog] = useState<OpenDialog>({ kind: "none" });

  const canModify = schoolClass.status === 0;
  const enrolled = schoolClass.active_students_count ?? 0;
  const close = () => setDialog({ kind: "none" });

  return (
    <div className="grid gap-6">
      <Button variant="ghost" size="sm" className="justify-self-start" asChild>
        <Link href="/academic/classes">
          <ArrowLeft aria-hidden="true" />
          Danh sách lớp học
        </Link>
      </Button>

      <ClassSummary schoolClass={schoolClass} />

      <RosterView
        state={roster.state}
        meta={roster.meta}
        search={roster.query.q}
        canModify={canModify}
        onSearchChange={roster.query.setSearch}
        onPageChange={roster.query.setPage}
        onAdd={() => setDialog({ kind: "add" })}
        onEdit={(enrollment) => setDialog({ kind: "edit", enrollment })}
        onTransfer={(enrollment) => setDialog({ kind: "transfer", enrollment })}
        onLeave={(enrollment) => setDialog({ kind: "leave", enrollment })}
      />

      <AddStudentsDialog
        classId={schoolClass.id}
        open={dialog.kind === "add"}
        onOpenChange={(open) => (open ? setDialog({ kind: "add" }) : close())}
        capacityHint={`Lớp hiện có ${enrolled}/${schoolClass.max_students} học sinh. Cả nhóm được thêm cùng một ngày vào lớp.`}
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
    </div>
  );
}
