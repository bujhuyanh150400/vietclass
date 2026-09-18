"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Teacher } from "../types/academic";
import { formatDate } from "../utils/labels";
import { TeacherAccountBadge, TeacherClasses, TeacherContact, TeacherJoinedDate, TeacherSubjects } from "./teacher-cells";
import { UserAvatar } from "./user-avatar";

/** Shows the compact profile sheet opened from a teacher identity or row menu. */
export function TeacherDetailDialog({
  teacher,
  onOpenChange,
}: {
  teacher: Teacher | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={teacher !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sheet border-vc-wood bg-card sm:max-w-2xl">
        {teacher === null ? null : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <UserAvatar
                  value={teacher.avatar}
                  name={teacher.full_name}
                  alt={`Ảnh đại diện của ${teacher.full_name}`}
                  className="size-14 border border-vc-control bg-background"
                />
                <div className="min-w-0">
                  <DialogTitle className="truncate">{teacher.full_name}</DialogTitle>
                  <DialogDescription>Mã hồ sơ #{teacher.id}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Liên hệ">
                <TeacherContact teacher={teacher} />
              </DetailBlock>
              <DetailBlock label="Tài khoản">
                <div className="flex items-center gap-2">
                  <TeacherAccountBadge teacher={teacher} />
                  <span className="text-xs text-muted-foreground">
                    {teacher.username ?? "Chưa cấp tài khoản"}
                  </span>
                </div>
              </DetailBlock>
              <DetailBlock label="Ngày tham gia">
                <TeacherJoinedDate teacher={teacher} />
              </DetailBlock>
              <DetailBlock label="Trạng thái hồ sơ">
                <span className="text-xs font-medium">
                  {teacher.status === 0 ? "Đang làm việc" : "Đã nghỉ"}
                </span>
              </DetailBlock>
            </div>

            <div className="grid gap-4 border-t border-vc-rule pt-4 sm:grid-cols-2">
              <DetailBlock label={`Bộ môn (${teacher.subjects.length})`}>
                <TeacherSubjects teacher={teacher} limit={3} />
              </DetailBlock>
              <DetailBlock label={`Lớp phụ trách (${teacher.classes.length})`}>
                <TeacherClasses teacher={teacher} limit={3} />
              </DetailBlock>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Tham gia từ {formatDate(teacher.joined_at)} · Cập nhật hồ sơ khi thông tin thay đổi.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] font-bold tracking-[0.05em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}
