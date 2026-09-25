"use client";

import {
  Eye,
  KeyRound,
  LockKeyhole,
  Pencil,
  RefreshCw,
} from "lucide-react";

import {
  RowActionMenu,
  type RowAction,
} from "@/components/shared/data-table";
import { InlineBadge } from "@/components/shared/inline-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/index";

import type { Teacher } from "../types/academic";
import { formatDate } from "../utils/labels";
import { UserAvatar } from "./user-avatar";

/** Renders the teacher's face, name, and honest profile identifier. */
export function TeacherIdentity({
  teacher,
  onView,
}: {
  teacher: Teacher;
  onView: (teacher: Teacher) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onView(teacher)}
      className="grid w-full min-w-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-3 border-0 bg-transparent p-0 text-left hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <UserAvatar
        value={teacher.avatar}
        name={teacher.full_name}
        alt={`Ảnh đại diện của ${teacher.full_name}`}
        className="size-11 border border-vc-control bg-background"
      />
      <span className="grid min-w-0 gap-0.5">
        <strong className="block truncate text-[13px] font-semibold">{teacher.full_name}</strong>
        <span className="truncate font-mono text-[10px] text-muted-foreground">
          Mã hồ sơ #{teacher.id}
        </span>
      </span>
    </button>
  );
}

/** Renders the two contact lines used to identify a teacher quickly. */
export function TeacherContact({ teacher }: { teacher: Teacher }) {
  return (
    <div className="grid min-w-0 gap-0.5 text-[11px] leading-[1.45]">
      <span className="truncate font-mono text-foreground">{teacher.phone ?? "Chưa có số điện thoại"}</span>
      <span className="truncate text-muted-foreground">{teacher.email ?? "Chưa có email"}</span>
    </div>
  );
}

/** Renders the account lifecycle state with the shared status treatment. */
export function TeacherAccountBadge({ teacher }: { teacher: Teacher }) {
  const active = teacher.is_account_active !== false;

  return <StatusBadge status={active ? "active" : "inactive"} label={active ? "Đang hoạt động" : "Đã khóa"} />;
}

/** Renders subject chips and opens the complete list when it overflows. */
export function TeacherSubjects({ teacher, limit = 2 }: { teacher: Teacher; limit?: number }) {
  const shown = teacher.subjects.slice(0, limit);
  const extraCount = Math.max(teacher.subjects.length - limit, 0);

  if (teacher.subjects.length === 0) {
    return <span className="text-[11px] text-muted-foreground">Chưa phân công</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {shown.map((subject) => (
        <InlineBadge
          key={subject.id}
          className="min-h-7 bg-card py-1 font-sans text-[10px] font-semibold whitespace-nowrap"
        >
          {subject.name}
        </InlineBadge>
      ))}
      {extraCount > 0 ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Xem thêm ${extraCount} bộ môn của ${teacher.full_name}`}
              className="h-7 rounded-control border-vc-rule bg-background px-2 text-[10px] font-semibold hover:bg-vc-tint"
            >
              +{extraCount}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sheet border-vc-wood bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bộ môn đang phụ trách</DialogTitle>
              <DialogDescription>
                {teacher.full_name} đang phụ trách {teacher.subjects.length} bộ môn.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((subject) => (
                <InlineBadge
                  key={subject.id}
                  type="muted"
                  size="md"
                  className="min-h-8 px-3 py-1.5 font-sans text-xs font-semibold"
                >
                  {subject.name}
                </InlineBadge>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

/** Renders class chips and opens the complete list when it overflows. */
export function TeacherClasses({ teacher, limit = 2 }: { teacher: Teacher; limit?: number }) {
  const shown = teacher.classes.slice(0, limit);
  const extraCount = Math.max(teacher.classes.length - limit, 0);

  if (teacher.classes.length === 0) {
    return <span className="text-[11px] text-muted-foreground">Chưa phụ trách lớp</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {shown.map((schoolClass) => (
        <InlineBadge
          key={schoolClass.id}
          title={schoolClass.name}
          className="min-h-7 bg-card py-1 text-[10px] font-semibold whitespace-nowrap"
        >
          {schoolClass.code}
        </InlineBadge>
      ))}
      {extraCount > 0 ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Xem thêm ${extraCount} lớp của ${teacher.full_name}`}
              className="h-7 rounded-control border-vc-rule bg-background px-2 text-[10px] font-semibold hover:bg-vc-tint"
            >
              +{extraCount}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sheet border-vc-wood bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lớp đang phụ trách</DialogTitle>
              <DialogDescription>
                {teacher.full_name} đang phụ trách {teacher.classes.length} lớp.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {teacher.classes.map((schoolClass) => (
                <div
                  key={schoolClass.id}
                  className="flex items-center justify-between gap-3 rounded-control border border-vc-rule bg-background px-3 py-2"
                >
                  <span className="font-mono text-xs font-semibold">{schoolClass.code}</span>
                  <span className="truncate text-xs text-muted-foreground">{schoolClass.name}</span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

/** Renders the date used by both the table and the teacher card. */
export function TeacherJoinedDate({ teacher }: { teacher: Teacher }) {
  return <span className="font-mono text-[11px] text-muted-foreground">{formatDate(teacher.joined_at)}</span>;
}

/** Keeps row and card layouts on the same teacher actions. */
export function TeacherRowMenu({
  teacher,
  onView,
  onToggleAccount,
  onChangePassword,
  className,
}: {
  teacher: Teacher;
  onView: (teacher: Teacher) => void;
  onToggleAccount: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
  className?: string;
}) {
  const actions: RowAction[] = [
    {
      key: "view",
      label: "Xem hồ sơ",
      icon: <Eye aria-hidden="true" className="text-foreground" />,
      onSelect: () => onView(teacher),
    },
    {
      key: "edit",
      label: "Sửa hồ sơ",
      icon: <Pencil aria-hidden="true" className="text-foreground" />,
      href: `/academic/teachers/${teacher.id}/edit`,
    },
    {
      key: "password",
      label: "Đổi mật khẩu",
      icon: <KeyRound aria-hidden="true" className="text-foreground" />,
      onSelect: () => onChangePassword(teacher),
    },
    "separator",
    {
      key: "account",
      label: teacher.is_account_active === false ? "Mở tài khoản" : "Khóa tài khoản",
      icon:
        teacher.is_account_active === false ? (
          <RefreshCw aria-hidden="true" className="text-foreground" />
        ) : (
          <LockKeyhole aria-hidden="true" className="text-foreground" />
        ),
      onSelect: () => onToggleAccount(teacher),
    },
  ];

  return (
    <RowActionMenu
      actions={actions}
      triggerLabel={`Thao tác với ${teacher.full_name}`}
      triggerClassName={cn(className)}
    />
  );
}
