"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/data-table";
import { useToast } from "@/components/shared/toast-provider";
import { SelectField } from "@/components/shared/select-field";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils/index";

import { GuardianInitials, GuardianPickerDialog } from "./guardian-picker-dialog";
import { MAX_GUARDIANS, type GuardianDraft } from "../schemas/academic-form-schema";
import type { GuardianRelationship } from "../types/academic";
import { GUARDIAN_RELATIONSHIP_CHOICES } from "../utils/labels";
import { SHEET_FIELD_TYPE } from "./form-control";

/** Which screen the roster is on, which is what the wording around it turns on. */
export type GuardianRosterMode = "create" | "edit";

/**
 * The sentences that differ between the two screens.
 *
 * They differ because the promise differs: on a new profile nothing exists yet and
 * the button says "Tạo học sinh", while on an existing one the reader is looking at
 * links that are already real and the edits they make are not. Saying "nhấn Lưu thay
 * đổi" on a screen with no such button, or leaving an edit screen silent about it,
 * are both ways of misleading somebody about whether their work is safe.
 */
const ROSTER_COPY: Record<
  GuardianRosterMode,
  { emptyTitle: string; foot: string; added: (name: string) => string; removed: (name: string) => string }
> = {
  create: {
    emptyTitle: "Chưa liên kết phụ huynh nào",
    foot: "",
    added: (name) => `Đã thêm ${name} vào hồ sơ. Nhấn Tạo học sinh để lưu.`,
    removed: (name) => `Đã gỡ liên kết với ${name}.`,
  },
  edit: {
    emptyTitle: "Hồ sơ chưa liên kết phụ huynh",
    foot: " Thay đổi chỉ được lưu khi bạn nhấn Lưu thay đổi.",
    added: (name) => `Đã thêm ${name} vào bản chỉnh sửa. Nhấn Lưu thay đổi để xác nhận.`,
    removed: (name) =>
      `Đã gỡ liên kết với ${name} trong bản chỉnh sửa. Nhấn Lưu thay đổi để xác nhận.`,
  },
};

/** Builds a key that stays with a row for as long as the form holds it. */
function draftKey(): string {
  return Math.random().toString(36).slice(2);
}

/**
 * What a row is, beyond the person it names.
 *
 * Creating, every row is pending by definition, so only the rows that will bring a
 * new profile into existence are worth marking. Editing, the list mixes links that
 * were already on the profile with ones added since it opened, and a reader who
 * cannot tell them apart cannot tell what leaving the page would cost them.
 */
function rowTag(draft: GuardianDraft, mode: GuardianRosterMode): string | null {
  if (draft.profile_id === null) {
    return "Sẽ tạo mới";
  }

  return mode === "edit" && !draft.is_saved ? "Mới thêm" : null;
}

/** One person on the roster, with the two things about them this student can change. */
function GuardianRow({
  draft,
  mode,
  disabled,
  onRelationshipChange,
  onRemove,
}: {
  draft: GuardianDraft;
  mode: GuardianRosterMode;
  disabled: boolean;
  onRelationshipChange: (relationship: GuardianRelationship) => void;
  onRemove: () => void;
}) {
  const tag = rowTag(draft, mode);

  return (
    <article className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-[11px] gap-y-3 rounded-control border border-vc-control bg-card p-3">
      <GuardianInitials name={draft.name} />

      <div className="min-w-0">
        <strong className="block truncate text-xs font-semibold">{draft.name}</strong>
        <small className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {draft.phone === "" ? "Chưa có số điện thoại" : draft.phone}
          </span>
          {/* Said plainly, because a row that will create a profile, one that links an
              existing person, and one already stored all look identical otherwise. */}
          {tag === null ? null : (
            <span className="rounded-[3px] border border-vc-control px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {tag}
            </span>
          )}
        </small>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        title="Gỡ liên kết"
        aria-label={`Gỡ liên kết với ${draft.name}`}
        className="size-9 shrink-0 rounded-[4px] text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>

      <div className="col-span-full flex flex-wrap items-center gap-2.5">
        <SelectField
          name={`guardian-relationship-${draft.key}`}
          label={`Quan hệ của ${draft.name} với học sinh`}
          value={draft.relationship}
          choices={GUARDIAN_RELATIONSHIP_CHOICES}
          disabled={disabled}
          onChange={(next) => onRelationshipChange(next as GuardianRelationship)}
          className="[&>label]:sr-only w-[178px] max-sm:w-full"
          size="control"
        />

        {/* The flag is a choice across the whole roster, so the control is one radio in
            a group that spans every row rather than a checkbox per row that would let a
            reader tick two. */}
        <label
          htmlFor={`guardian-primary-${draft.key}`}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-[11px] font-semibold max-sm:w-full",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
            draft.is_primary
              ? "border-vc-ink bg-vc-ink text-vc-paper"
              : "border-vc-control bg-card text-muted-foreground hover:bg-vc-tint",
          )}
        >
          <RadioGroupItem
            id={`guardian-primary-${draft.key}`}
            value={draft.key}
            disabled={disabled}
            className={cn("border-vc-control", draft.is_primary && "border-vc-paper [&_svg]:fill-vc-paper")}
          />
          Liên hệ chính
        </label>
      </div>
    </article>
  );
}

/**
 * Collects the people a student is linked to.
 *
 * A student may have a father, a mother, a grandparent who does the school run — and
 * the same person may be linked to a sibling too. So this is a roster rather than one
 * guardian: the reader adds people one at a time, says who each is to the student, and
 * marks the one the school calls first.
 *
 * Nothing is written until the sheet is saved. Adding, removing and moving the main
 * contact all happen in the form's own state, which is what lets a reader build the
 * list, change their mind, and leave without having touched a record.
 *
 * Presentational apart from the search the dialog runs: the list itself lives in the
 * form it is handed.
 */
export function GuardianRosterField({
  value,
  onChange,
  mode,
  disabled = false,
  error,
}: {
  value: GuardianDraft[];
  onChange: (next: GuardianDraft[]) => void;
  mode: GuardianRosterMode;
  disabled?: boolean;
  error?: string;
}) {
  const [picking, setPicking] = useState(false);
  const showToast = useToast();
  const copy = ROSTER_COPY[mode];

  const count = value.length;
  const full = count >= MAX_GUARDIANS;
  const primaryKey = value.find((draft) => draft.is_primary)?.key ?? "";

  /** Appends one existing guardian without silently selecting a primary. */
  function add(entry: Omit<GuardianDraft, "key" | "is_primary" | "is_saved">): void {
    onChange([...value, { ...entry, key: draftKey(), is_primary: false, is_saved: false }]);
    showToast({ variant: "success", title: copy.added(entry.name) });
  }

  /** Drops one person without silently choosing a replacement primary. */
  function remove(key: string): void {
    const removed = value.find((draft) => draft.key === key);

    if (removed === undefined) {
      return;
    }

    const next = value.filter((draft) => draft.key !== key);

    onChange(next);
    showToast({ title: copy.removed(removed.name) });
  }

  /** Moves the main-contact flag, which only ever sits on one row. */
  function choosePrimary(key: string): void {
    onChange(value.map((draft) => ({ ...draft, is_primary: draft.key === key })));
  }

  const addButton = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled || full}
      className="h-11 rounded-control border-vc-control text-[11px] max-sm:w-full"
      onClick={() => setPicking(true)}
    >
      <Plus aria-hidden="true" className="size-4" />
      Thêm phụ huynh
    </Button>
  );

  return (
    <div className={cn("grid gap-3.5", SHEET_FIELD_TYPE)}>
      <div className="rounded-panel border border-vc-rule bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-vc-rule px-[18px] py-3 max-md:px-3.5">
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="grid size-6 place-items-center rounded-full border border-vc-control bg-card font-mono text-[10px] font-semibold text-foreground">
              {count}
            </span>
            {count === 0 ? "chưa có ai được liên kết" : "người đang được liên kết"}
          </p>
          {count === 0 ? null : addButton}
        </div>

        {count === 0 ? (
          <EmptyState
            image="/images/empty_1.png"
            title={copy.emptyTitle}
            description="Một học sinh có thể có nhiều phụ huynh hoặc người giám hộ. Thêm ít nhất một người để nhà trường biết liên hệ với ai."
            action={addButton}
          />
        ) : (
          <RadioGroup
            value={primaryKey}
            aria-label="Người liên hệ chính"
            disabled={disabled}
            className="gap-2.5 p-[18px] max-md:p-3.5"
            onValueChange={choosePrimary}
          >
            {value.map((draft) => (
              <GuardianRow
                key={draft.key}
                draft={draft}
                mode={mode}
                disabled={disabled}
                onRelationshipChange={(relationship) =>
                  onChange(
                    value.map((row) => (row.key === draft.key ? { ...row, relationship } : row)),
                  )
                }
                onRemove={() => remove(draft.key)}
              />
            ))}
          </RadioGroup>
        )}
      </div>

      {count === 0 ? null : (
        <p className="text-[10px] leading-[1.6] text-muted-foreground">
          Người được đánh dấu <strong className="font-semibold">Liên hệ chính</strong> sẽ nhận thông
          báo của nhà trường trước tiên.{copy.foot}
        </p>
      )}

      {full ? (
        <p className="text-[10px] leading-[1.6] text-muted-foreground">
          Đã đạt giới hạn {MAX_GUARDIANS} phụ huynh cho một học sinh.
        </p>
      ) : null}

      {error === undefined ? null : (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}

      <GuardianPickerDialog
        open={picking}
        onOpenChange={setPicking}
        roster={value}
        onAdd={add}
      />
    </div>
  );
}
