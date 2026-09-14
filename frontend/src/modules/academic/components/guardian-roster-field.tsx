"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/data-table";
import { SelectField } from "@/components/shared/select-field";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils/index";

import { GuardianInitials, GuardianPickerDialog } from "./guardian-picker-dialog";
import { MAX_GUARDIANS, type GuardianDraft } from "../schemas/academic-form-schema";
import type { GuardianRelationship } from "../types/academic";
import { GUARDIAN_RELATIONSHIP_CHOICES } from "../utils/labels";
import { SHEET_CONTROL, SHEET_FIELD_TYPE } from "./form-control";

/** Builds a key that stays with a row for as long as the form holds it. */
function draftKey(): string {
  return Math.random().toString(36).slice(2);
}

/** One person on the roster, with the two things about them this student can change. */
function GuardianRow({
  draft,
  disabled,
  onRelationshipChange,
  onRemove,
}: {
  draft: GuardianDraft;
  disabled: boolean;
  onRelationshipChange: (relationship: GuardianRelationship) => void;
  onRemove: () => void;
}) {
  return (
    <article className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-[11px] gap-y-3 rounded-control border border-vc-control bg-card p-3">
      <GuardianInitials name={draft.name} />

      <div className="min-w-0">
        <strong className="block truncate text-xs font-semibold">{draft.name}</strong>
        <small className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {draft.phone === "" ? "Chưa có số điện thoại" : draft.phone}
          </span>
          {/* Says plainly that this person does not exist yet, because a row that will
              create a profile and a row that links one look identical otherwise. */}
          {draft.profile_id === null ? (
            <span className="rounded-[3px] border border-vc-control px-1.5 py-0.5 text-[9px] text-muted-foreground">
              Sẽ tạo mới
            </span>
          ) : null}
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
          triggerClassName={SHEET_CONTROL}
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
  disabled = false,
  error,
}: {
  value: GuardianDraft[];
  onChange: (next: GuardianDraft[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [picking, setPicking] = useState(false);

  const count = value.length;
  const full = count >= MAX_GUARDIANS;
  const primaryKey = value.find((draft) => draft.is_primary)?.key ?? "";

  /** Appends one person, making them the main contact when nobody else is. */
  function add(entry: Omit<GuardianDraft, "key" | "is_primary">): void {
    onChange([...value, { ...entry, key: draftKey(), is_primary: count === 0 }]);
  }

  /**
   * Drops one person, promoting the first of the rest when the main contact leaves.
   *
   * A roster that still has somebody on it always names who to call first, so removing
   * the flagged row has to hand the flag on rather than leave the school with a list
   * and no first number.
   */
  function remove(key: string): void {
    const next = value.filter((draft) => draft.key !== key);
    const removedPrimary = value.find((draft) => draft.key === key)?.is_primary === true;

    onChange(
      removedPrimary && next.length > 0
        ? next.map((draft, index) => ({ ...draft, is_primary: index === 0 }))
        : next,
    );
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
            title="Chưa liên kết phụ huynh nào"
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
          báo của nhà trường trước tiên.
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
        linkedProfileIds={value
          .map((draft) => draft.profile_id)
          .filter((id): id is number => id !== null)}
        onAdd={add}
      />
    </div>
  );
}
