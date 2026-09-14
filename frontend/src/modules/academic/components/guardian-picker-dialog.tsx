"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { Field } from "@/components/shared/field";
import { SelectField } from "@/components/shared/select-field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn, personInitials } from "@/lib/utils/index";

import { useGuardianOptions } from "../hooks/use-guardians";
import type { GuardianDraft } from "../schemas/academic-form-schema";
import type { Gender, GuardianOption, GuardianRelationship } from "../types/academic";
import { GENDER_LABELS, GUARDIAN_RELATIONSHIP_CHOICES } from "../utils/labels";
import { SHEET_CONTROL, SHEET_FIELD_GRID, SHEET_FIELD_TYPE } from "./form-control";

/** Which of the two ways of naming a person the dialog is showing. */
type PickerSource = "existing" | "new";

const GENDER_CHOICES = [
  { value: 0, label: GENDER_LABELS[0] },
  { value: 1, label: GENDER_LABELS[1] },
  { value: 2, label: GENDER_LABELS[2] },
];

/** The name chip a person is recognised by in the results and on the roster. */
export function GuardianInitials({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-vc-control bg-vc-tint text-[10px] font-semibold",
        className,
      )}
    >
      {personInitials(name)}
    </span>
  );
}

/**
 * Adds one person to a student's guardian roster.
 *
 * It is a dialog rather than a panel on the page because adding somebody is a
 * self-contained decision with its own two ways of being made — find a person already
 * on file, or describe a new one — and the roster behind it is the thing the reader is
 * actually building. Keeping both sources permanently on the page would mean two sets
 * of half-filled fields sitting under a list they do not belong to.
 *
 * Nothing here reaches the API. The dialog hands a row back and the form holds it until
 * the sheet is saved, which is what lets a reader add three people, change their minds
 * about one, and still have written nothing.
 *
 * Its own validation is deliberately local: it guards the one thing the roster cannot
 * express — an entry with nobody named or no relationship chosen — and leaves
 * everything else to the form resolver that runs on submit.
 */
export function GuardianPickerDialog({
  open,
  onOpenChange,
  linkedProfileIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who is already on the roster, so the results can say so and refuse a duplicate. */
  linkedProfileIds: number[];
  onAdd: (draft: Omit<GuardianDraft, "key" | "is_primary">) => void;
}) {
  const [source, setSource] = useState<PickerSource>("existing");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<GuardianOption | null>(null);
  const [relationship, setRelationship] = useState<GuardianRelationship | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>(0);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const guardians = useGuardianOptions(debouncedSearch);

  /** Returns the dialog to the state it opens in, so the next add starts clean. */
  function reset(): void {
    setSource("existing");
    setSearch("");
    setPicked(null);
    setRelationship(undefined);
    setName("");
    setPhone("");
    setGender(0);
    setError(null);
  }

  /** Hands the described person back to the roster, or says what is still missing. */
  function confirm(): void {
    if (relationship === undefined) {
      setError("Vui lòng chọn quan hệ với học sinh.");

      return;
    }

    if (source === "existing") {
      if (picked === null) {
        setError("Hãy chọn một phụ huynh trong danh sách, hoặc chuyển sang thẻ Tạo phụ huynh mới.");

        return;
      }

      onAdd({
        profile_id: picked.id,
        name: picked.label,
        phone: picked.phone ?? "",
        gender: 0,
        relationship,
      });
    } else {
      if (name.trim() === "") {
        setError("Vui lòng nhập họ và tên phụ huynh.");

        return;
      }

      onAdd({ profile_id: null, name: name.trim(), phone: phone.trim(), gender, relationship });
    }

    reset();
    onOpenChange(false);
  }

  const results = guardians.data ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }

        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Thêm phụ huynh</DialogTitle>
        </DialogHeader>

        <div className={cn("grid gap-4", SHEET_FIELD_TYPE)}>
          {/* The selected source is filled with ink rather than merely raised: both
              triggers sit on the same paper, and a white-on-white "active" tab reads
              as neither. */}
          <Tabs
            value={source}
            onValueChange={(next) => {
              setSource(next as PickerSource);
              setError(null);
            }}
          >
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-control border border-vc-control bg-card p-[3px] group-data-[orientation=horizontal]/tabs:h-auto">
              <TabsTrigger
                value="existing"
                className="min-h-10 rounded-[3px] text-[11px] font-medium data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper data-[state=active]:shadow-none"
              >
                Phụ huynh có sẵn
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="min-h-10 rounded-[3px] text-[11px] font-medium data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper data-[state=active]:shadow-none"
              >
                Tạo phụ huynh mới
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {source === "existing" ? (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="guardian-search" className="text-xs font-medium">
                  Tìm phụ huynh theo tên hoặc số điện thoại
                </label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="guardian-search"
                    type="search"
                    value={search}
                    placeholder="Nhập tên hoặc SĐT…"
                    className={cn(SHEET_CONTROL, "pl-[39px]")}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid max-h-[210px] gap-1 overflow-y-auto rounded-panel border border-vc-control bg-card p-1.5">
                {guardians.isPending ? (
                  <>
                    <Skeleton className="h-[54px] rounded-[4px]" />
                    <Skeleton className="h-[54px] rounded-[4px]" />
                  </>
                ) : results.length === 0 ? (
                  <p className="p-2.5 text-[11px] leading-[1.6] text-muted-foreground">
                    Không tìm thấy phụ huynh phù hợp. Chuyển sang thẻ Tạo phụ huynh mới để
                    thêm người chưa có trong hệ thống.
                  </p>
                ) : (
                  results.map((guardian) => {
                    const linked = linkedProfileIds.includes(guardian.id);

                    return (
                      <button
                        key={guardian.id}
                        type="button"
                        disabled={linked}
                        aria-pressed={picked?.id === guardian.id}
                        className={cn(
                          "flex min-h-[54px] items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          linked
                            ? "cursor-not-allowed opacity-55"
                            : picked?.id === guardian.id
                              ? "bg-vc-tint ring-1 ring-foreground"
                              : "hover:bg-vc-tint",
                        )}
                        onClick={() => {
                          setPicked(guardian);
                          setError(null);
                        }}
                      >
                        <GuardianInitials name={guardian.label} />
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[11px] font-semibold">
                            {guardian.label}
                          </strong>
                          <small className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                            {guardian.phone ?? "Chưa có số điện thoại"}
                          </small>
                        </span>
                        {linked ? (
                          <span className="shrink-0 rounded-[3px] border border-vc-control px-1.5 py-0.5 text-[9px] text-muted-foreground">
                            Đã liên kết
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {picked === null ? null : (
                <article className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-[11px] rounded-control border border-vc-control bg-card p-3">
                  <GuardianInitials name={picked.label} className="size-[42px]" />
                  <div className="min-w-0">
                    <span className="block text-[9px] tracking-[0.08em] text-muted-foreground uppercase">
                      Sẽ liên kết
                    </span>
                    <strong className="mt-0.5 block truncate text-xs font-semibold">
                      {picked.label}
                    </strong>
                    <small className="block font-mono text-[10px] text-muted-foreground">
                      {picked.phone ?? "Chưa có số điện thoại"}
                    </small>
                  </div>
                </article>
              )}
            </div>
          ) : (
            <div className={SHEET_FIELD_GRID}>
              <Field name="new-guardian-name" label="Họ và tên" required>
                <Input
                  id="new-guardian-name"
                  value={name}
                  placeholder="Nhập họ và tên phụ huynh"
                  autoComplete="off"
                  className={SHEET_CONTROL}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                  }}
                />
              </Field>

              <Field name="new-guardian-phone" label="Số điện thoại" hint="Không bắt buộc.">
                <Input
                  id="new-guardian-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  placeholder="Nhập số điện thoại"
                  className={SHEET_CONTROL}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>

              <SelectField
                name="new-guardian-gender"
                label="Giới tính"
                required
                value={gender}
                choices={GENDER_CHOICES}
                onChange={(next) => setGender(next as Gender)}
                triggerClassName={SHEET_CONTROL}
              />

              <SelectField
                name="new-guardian-relationship"
                label="Quan hệ với học sinh"
                required
                value={relationship}
                placeholder="Chọn quan hệ"
                choices={GUARDIAN_RELATIONSHIP_CHOICES}
                onChange={(next) => {
                  setRelationship(next as GuardianRelationship);
                  setError(null);
                }}
                triggerClassName={SHEET_CONTROL}
              />
            </div>
          )}

          {source === "existing" ? (
            <SelectField
              name="picker-relationship"
              label="Quan hệ với học sinh"
              required
              value={relationship}
              placeholder="Chọn quan hệ"
              choices={GUARDIAN_RELATIONSHIP_CHOICES}
              onChange={(next) => {
                setRelationship(next as GuardianRelationship);
                setError(null);
              }}
              triggerClassName={SHEET_CONTROL}
            />
          ) : null}

          {error === null ? null : (
            <p role="alert" className="text-[11px] font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={confirm}>
            <Plus aria-hidden="true" className="size-4" />
            Thêm vào hồ sơ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
