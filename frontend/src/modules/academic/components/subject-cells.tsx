"use client";

import { BookOpen, LockKeyhole, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { RowActionMenu, type RowAction } from "@/components/shared/data-table";
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

import type { GradeLevel, Subject } from "../types/academic";
import { GRADE_LEVEL_LABELS } from "../utils/labels";

/** Renders a subject name and its available secondary identifier. */
export function SubjectIdentity({
  subject,
  onView,
}: {
  subject: Subject;
  onView: (subject: Subject) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onView(subject)}
      className="grid w-full min-w-0 gap-0.5 border-0 bg-transparent p-0 text-left hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <strong className="block truncate text-[13px] font-semibold">{subject.name}</strong>
      <span className="truncate text-[10px] text-muted-foreground">
        {subject.description ?? "Chưa có mô tả"}
      </span>
    </button>
  );
}

/** Renders the number of active classes using the same aligned mono treatment as the mock. */
export function SubjectClassCount({ subject }: { subject: Subject }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap font-mono text-[13px] font-semibold">
      {subject.active_classes_count ?? 0}
      <small className="font-sans text-[10px] font-medium text-muted-foreground">lớp</small>
    </span>
  );
}

/** Renders the subject lifecycle status with the shared dot and color treatment. */
export function SubjectStatusBadge({ subject }: { subject: Subject }) {
  return (
    <StatusBadge
      status={subject.is_active ? "active" : "inactive"}
      label={subject.is_active ? "Hoạt động" : "Ngừng hoạt động"}
    />
  );
}

/** Renders up to three grade chips and opens the complete set when needed. */
export function SubjectGradeLevels({ subject, limit = 3 }: { subject: Subject; limit?: number }) {
  const shown = subject.grade_levels.slice(0, limit);
  const extraCount = Math.max(subject.grade_levels.length - limit, 0);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {shown.map((gradeLevel) => (
        <InlineBadge
          key={gradeLevel}
          title={GRADE_LEVEL_LABELS[gradeLevel]}
          className="min-h-7 min-w-[54px] justify-center bg-card py-1 font-sans text-[10px] font-semibold whitespace-nowrap"
        >
          {formatGradeLevel(gradeLevel)}
        </InlineBadge>
      ))}
      {extraCount > 0 ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Xem thêm ${extraCount} khối áp dụng của ${subject.name}`}
              className="h-7 rounded-control border-vc-rule bg-background px-2 text-[10px] font-semibold hover:bg-vc-tint"
            >
              +{extraCount}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-sheet border-vc-wood bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Các khối áp dụng</DialogTitle>
              <DialogDescription>
                {subject.name} đang áp dụng cho {subject.grade_levels.length} khối.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {subject.grade_levels.map((gradeLevel) => (
                <InlineBadge
                  key={gradeLevel}
                  type="muted"
                  size="md"
                  className="min-h-8 px-3 py-1.5 font-sans text-xs font-semibold"
                >
                  {formatGradeLevel(gradeLevel)}
                </InlineBadge>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

/** Keeps row and card layouts on the same subject actions. */
export function SubjectRowMenu({
  subject,
  onView,
  onToggleActive,
  onDelete,
  className,
}: {
  subject: Subject;
  onView: (subject: Subject) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  className?: string;
}) {
  const actions: RowAction[] = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: <BookOpen aria-hidden="true" className="text-foreground" />,
      onSelect: () => onView(subject),
    },
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: <Pencil aria-hidden="true" className="text-foreground" />,
      href: `/academic/subjects/${subject.id}`,
    },
    {
      key: "toggle",
      label: subject.is_active ? "Ngừng hoạt động" : "Kích hoạt lại",
      icon: subject.is_active ? (
        <LockKeyhole aria-hidden="true" className="text-foreground" />
      ) : (
        <RefreshCw aria-hidden="true" className="text-foreground" />
      ),
      onSelect: () => onToggleActive(subject),
    },
    "separator",
    {
      key: "delete",
      label: "Xóa",
      icon: <Trash2 aria-hidden="true" />,
      variant: "destructive",
      onSelect: () => onDelete(subject),
    },
  ];

  return (
    <RowActionMenu
      actions={actions}
      triggerLabel={`Thao tác với ${subject.name}`}
      triggerClassName={cn(className)}
    />
  );
}

function formatGradeLevel(gradeLevel: GradeLevel): string {
  return gradeLevel === 0 ? "Tiền TH" : `Khối ${gradeLevel}`;
}
