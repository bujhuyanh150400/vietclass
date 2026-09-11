"use client";

import { School } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, personInitials } from "@/lib/utils/index";

import type { Student } from "../types/academic";
import { GRADE_LEVEL_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from "../utils/labels";

/** How many tags fit in a cell before the rest collapse into a count. */
const VISIBLE_TAGS = 2;

/**
 * Where a group of tags is being drawn.
 *
 * A table cell has a column width to fill, so its tags cap at a readable width
 * and leave the rest of the cell empty. A card has no column, so its two tags
 * split the row instead — capping them there would leave a gap that reads as a
 * missing third chip.
 */
export type TagLayout = "table" | "card";

/** The width one tag takes in each layout. */
const TAG_WIDTH: Record<TagLayout, { guardian: string; class: string; group: string }> = {
  // Sized to their content up to a cap, shrinking only when the row is tight, so
  // a name that fits is not truncated just because the chip beside it is long.
  table: {
    guardian: "max-w-[142px]",
    class: "max-w-[128px]",
    group: "",
  },
  card: {
    guardian: "max-w-[calc(50%-0.625rem)] flex-1",
    class: "max-w-[calc(50%-0.625rem)] flex-1",
    group: "w-full",
  },
};

/**
 * Renders one related record as a compact chip: a monogram or icon, the name it
 * is known by, and one line of qualifying detail beneath.
 *
 * Both lines truncate rather than wrap, because a cell holds two of these side
 * by side and a chip that grew a second line would change the row's height.
 */
function EntityTag({
  leading,
  title,
  detail,
  tooltip,
  className,
}: {
  leading?: ReactNode;
  title: string;
  detail: string;
  tooltip: string;
  className?: string;
}) {
  return (
    <span
      title={tooltip}
      className={cn(
        "inline-flex h-[34px] min-w-0 items-center gap-1.5 rounded-control border border-vc-rule bg-card py-1 pr-2",
        leading ? "pl-1.5" : "pl-2",
        className,
      )}
    >
      {leading}
      <span className="min-w-0">
        <strong className="block truncate text-[11px] leading-tight font-semibold">{title}</strong>
        <small className="block truncate text-[9px] leading-tight text-muted-foreground">
          {detail}
        </small>
      </span>
    </span>
  );
}

/** Renders the monogram square on a guardian chip, dotted when it is the main contact. */
function GuardianMonogram({ name, isPrimary }: { name: string; isPrimary: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-6 shrink-0 place-items-center rounded-control bg-background text-[9px] font-bold"
    >
      {personInitials(name)}
      {isPrimary ? (
        <span className="absolute -right-0.5 -bottom-0.5 size-[7px] rounded-full border-2 border-card bg-vc-orange" />
      ) : null}
    </span>
  );
}

/**
 * Renders the placeholder for a relation the student simply does not have.
 *
 * It is a dashed outline rather than a dash, so an empty cell reads as a slot
 * waiting to be filled instead of as data that failed to load.
 */
export function EmptyInline({
  children,
  layout = "table",
}: {
  children: string;
  layout?: TagLayout;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-control border border-dashed border-vc-rule px-2.5 text-[11px] font-semibold text-muted-foreground",
        layout === "card" && "w-full justify-center",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Renders the "+N" control that opens the full list of collapsed relations.
 *
 * The count is named `collapsed` rather than `hidden`, which is a DOM attribute
 * of its own on every button.
 */
function OverflowChip({
  collapsed,
  label,
  ...props
}: { collapsed: number; label: string } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-8 min-w-[34px] shrink-0 place-items-center rounded-control border border-vc-control bg-background px-1.5 font-mono text-[11px] font-bold hover:bg-vc-tint focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      {...props}
    >
      +{collapsed}
    </button>
  );
}

/**
 * Renders a student's guardians as chips, collapsing any past the first two into
 * a count that opens the complete list.
 *
 * The main contact is always among the chips on screen because the API returns
 * that guardian first, and the dialog lists every guardian rather than only the
 * hidden ones — someone opening it wants the household, not the remainder.
 *
 * Owns its own dialog state so the surrounding list stays presentational.
 */
export function GuardianTags({
  student,
  layout = "table",
}: {
  student: Student;
  layout?: TagLayout;
}) {
  const [open, setOpen] = useState(false);
  const guardians = student.guardians;

  if (guardians.length === 0) {
    return <EmptyInline layout={layout}>Chưa có phụ huynh</EmptyInline>;
  }

  const collapsed = guardians.length - VISIBLE_TAGS;

  return (
    <div className={cn("flex min-w-0 items-center gap-[5px]", TAG_WIDTH[layout].group)}>
      {guardians.slice(0, VISIBLE_TAGS).map((guardian) => {
        const relation = GUARDIAN_RELATIONSHIP_LABELS[guardian.relationship];

        return (
          <EntityTag
            key={guardian.profile_id}
            className={TAG_WIDTH[layout].guardian}
            leading={<GuardianMonogram name={guardian.full_name} isPrimary={guardian.is_primary} />}
            title={guardian.full_name}
            detail={guardian.is_primary ? `${relation} · Chính` : relation}
            tooltip={`${guardian.full_name} · ${relation}${guardian.is_primary ? " · Liên hệ chính" : ""}`}
          />
        );
      })}

      {collapsed > 0 ? (
        <OverflowChip
          collapsed={collapsed}
          label={`Xem tất cả ${guardians.length} phụ huynh của ${student.full_name}`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        />
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Danh sách phụ huynh</DialogTitle>
            <DialogDescription>
              {`${student.full_name} · ${GRADE_LEVEL_LABELS[student.grade_level]} · ${guardians.length} phụ huynh`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            {guardians.map((guardian) => (
              <div
                key={guardian.profile_id}
                className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-panel border border-vc-rule bg-card p-2.5"
              >
                <GuardianMonogram name={guardian.full_name} isPrimary={guardian.is_primary} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{guardian.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {guardian.phone === null
                      ? GUARDIAN_RELATIONSHIP_LABELS[guardian.relationship]
                      : `${GUARDIAN_RELATIONSHIP_LABELS[guardian.relationship]} · ${guardian.phone}`}
                  </p>
                </div>
                {guardian.is_primary ? (
                  <Badge variant="outline" className="whitespace-nowrap">
                    Liên hệ chính
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Renders the classes a student still attends as chips, collapsing any past the
 * first two into a count that opens the complete list.
 *
 * A popover rather than a dialog: a class is named by a short code, so the
 * remainder is a glance rather than something to read, and a dialog would take
 * over the screen for two lines of text.
 *
 * Owns its own popover state so the surrounding list stays presentational.
 */
export function ClassTags({
  student,
  layout = "table",
}: {
  student: Student;
  layout?: TagLayout;
}) {
  const enrollments = student.active_enrollments;

  if (enrollments.length === 0) {
    return <EmptyInline layout={layout}>Chưa có lớp</EmptyInline>;
  }

  const collapsed = enrollments.length - VISIBLE_TAGS;

  return (
    <div className={cn("flex min-w-0 items-center gap-[5px]", TAG_WIDTH[layout].group)}>
      {enrollments.slice(0, VISIBLE_TAGS).map((enrollment) => (
        <EntityTag
          key={enrollment.class_id}
          className={TAG_WIDTH[layout].class}
          title={enrollment.code}
          detail={enrollment.subject_name ?? "Chưa rõ môn"}
          tooltip={`${enrollment.code} · ${enrollment.subject_name ?? "Chưa rõ môn"}`}
        />
      ))}

      {collapsed > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <OverflowChip
              collapsed={collapsed}
              label={`Xem tất cả ${enrollments.length} lớp của ${student.full_name}`}
            />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60 p-1.5">
            <p className="flex items-center justify-between gap-2 px-2 pt-1 pb-2 text-xs font-semibold">
              Lớp đang học
              <span className="font-mono text-muted-foreground">{enrollments.length}</span>
            </p>
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.class_id}
                className="flex items-center gap-2 rounded-control px-2 py-1.5"
              >
                <School aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <strong className="block truncate text-xs font-semibold">
                    {enrollment.code}
                  </strong>
                  <small className="block truncate text-[10px] text-muted-foreground">
                    {enrollment.subject_name ?? "Chưa rõ môn"}
                  </small>
                </span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )
        : null}
    </div>
  );
}
