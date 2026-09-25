"use client";

import Link from "next/link";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CircleAlert, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";

import { Field } from "@/components/shared/field";
import { InlineBadge } from "@/components/shared/inline-badge";
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

import { fetchGuardianOptions } from "../api/guardians-api";
import { academicQueryKeys } from "../hooks/academic-query-keys";
import { useGuardianOptions } from "../hooks/use-guardians";
import type { GuardianDraft } from "../schemas/academic-form-schema";
import type { Gender, GuardianOption, GuardianRelationship } from "../types/academic";
import {
  findGuardianDuplicate,
  type GuardianDuplicate,
  type GuardianDuplicateReason,
} from "../utils/guardian-duplicate";
import { GENDER_LABELS, GUARDIAN_RELATIONSHIP_CHOICES } from "../utils/labels";
import { SHEET_FIELD_GRID, SHEET_FIELD_TYPE } from "./form-control";

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

/** What each kind of clash says, and how loudly. */
const DUPLICATE_COPY: Record<
  GuardianDuplicateReason,
  { soft: boolean; title: string; body: string }
> = {
  phone: {
    soft: false,
    title: "Số điện thoại này đã thuộc về một phụ huynh khác",
    body: "Mỗi số điện thoại thường chỉ gắn với một người, nên nhiều khả năng đây là cùng một phụ huynh. Hãy liên kết người có sẵn thay vì tạo hồ sơ trùng.",
  },
  name: {
    soft: true,
    title: "Trong hệ thống đã có người trùng tên",
    body: "Tên tiếng Việt rất hay trùng nhau. Nếu đúng là người này thì liên kết lại; nếu là người khác, bạn vẫn tạo mới được.",
  },
  linked: {
    soft: true,
    title: "Người này đã có trong danh sách phụ huynh của học sinh",
    body: "Không cần thêm lần nữa. Bạn có thể đổi quan hệ hoặc liên hệ chính ngay trên dòng đang có.",
  },
};

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
  roster,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who is already linked, so the results can say so and a clash can be recognised. */
  roster: GuardianDraft[];
  onAdd: (draft: Omit<GuardianDraft, "key" | "is_primary" | "is_saved">) => void;
}) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<PickerSource>("existing");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<GuardianOption | null>(null);
  const [relationship, setRelationship] = useState<GuardianRelationship | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>(0);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<GuardianDuplicate | null>(null);
  const [checking, setChecking] = useState(false);

  const linkedProfileIds = roster
    .map((draft) => draft.profile_id)
    .filter((id): id is number => id !== null);

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
    setDuplicate(null);
  }

  /** Clears a standing warning once the reader edits what it was about. */
  function clearDuplicate(): void {
    setDuplicate(null);
  }

  /**
   * Asks the directory who matches the typed name or number.
   *
   * Fetched on confirm rather than watched while typing: the check has to have
   * finished before the row is added, and a query still in flight when the reader
   * presses the button would let a duplicate straight through. It shares the key the
   * search box uses, so a term already looked up answers from cache.
   */
  async function findMatches(term: string): Promise<GuardianOption[]> {
    if (term.trim() === "") {
      return [];
    }

    return queryClient.fetchQuery({
      queryKey: academicQueryKeys.guardians.options(term),
      queryFn: () => fetchGuardianOptions({ q: term, limit: 20 }),
    });
  }

  /** Adds one row and closes, whichever of the two tabs described it. */
  function commit(entry: Omit<GuardianDraft, "key" | "is_primary" | "is_saved">): void {
    onAdd(entry);
    reset();
    onOpenChange(false);
  }

  /** Hands the described person back to the roster, or says what is still missing. */
  async function confirm(): Promise<void> {
    if (relationship === undefined) {
      setError("Vui lòng chọn quan hệ với học sinh.");

      return;
    }

    if (source === "existing") {
      if (picked === null) {
        setError("Hãy chọn một phụ huynh có sẵn trong danh sách.");

        return;
      }

      commit({
        profile_id: picked.id,
        name: picked.label,
        phone: picked.phone ?? "",
        gender: 0,
        relationship,
      });

      return;
    }

    const typedName = name.trim();
    const typedPhone = phone.trim();

    if (typedName === "") {
      setError("Vui lòng nhập họ và tên phụ huynh.");

      return;
    }

    setChecking(true);

    try {
      // Looked up by number when there is one, because that is what identifies a
      // person; by name otherwise. The endpoint searches both columns, so a payload
      // carrying a number asks twice only to catch a name-only clash as well.
      const byNumber = typedPhone === "" ? [] : await findMatches(typedPhone);
      const byName = await findMatches(typedName);
      const clash = findGuardianDuplicate({
        name: typedName,
        phone: typedPhone,
        roster,
        candidates: [...byNumber, ...byName],
      });

      if (clash !== null) {
        setDuplicate(clash);
        setError(null);

        return;
      }
    } catch {
      // A directory that cannot be reached must not stop the reader recording a
      // guardian: the check is a courtesy, and the API refuses a genuinely illegal
      // roster on its own.
    } finally {
      setChecking(false);
    }

    setError("Hãy tạo hồ sơ phụ huynh trong mục Quản lý phụ huynh trước khi liên kết.");
  }

  /** Takes the warning's advice and links the person it found instead. */
  function linkDuplicate(): void {
    if (duplicate === null || duplicate.profile_id === null || relationship === undefined) {
      return;
    }

    commit({
      profile_id: duplicate.profile_id,
      name: duplicate.name,
      phone: duplicate.phone ?? "",
      gender: 0,
      relationship,
    });
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
              clearDuplicate();
            }}
          >
            <TabsList variant="segmented" className="grid-cols-1">
              <TabsTrigger
                value="existing"
                className="rounded-[3px] text-[11px] font-medium data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper"
              >
                Phụ huynh có sẵn
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
                    size="control"
                    className="pl-[39px]"
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
                    Không tìm thấy phụ huynh phù hợp. Admin có thể mở{" "}
                    <Link className="font-semibold underline" href="/academic/guardians/new">
                      Quản lý phụ huynh
                    </Link>{" "}
                    để thêm hồ sơ rồi quay lại liên kết.
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
                          <InlineBadge
                            type="muted"
                            className="min-h-0 shrink-0 rounded-[3px] px-1.5 py-0.5 font-sans text-[9px] text-muted-foreground"
                          >
                            Đã liên kết
                          </InlineBadge>
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
                  size="control"
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                    clearDuplicate();
                  }}
                />
              </Field>

              <Field
                name="new-guardian-phone"
                label="Số điện thoại"
                hint="Dùng để nhận ra phụ huynh đã có trong hệ thống."
              >
                <Input
                  id="new-guardian-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  placeholder="Nhập số điện thoại"
                  size="control"
                  onChange={(event) => {
                    setPhone(event.target.value);
                    clearDuplicate();
                  }}
                />
              </Field>

              <SelectField
                name="new-guardian-gender"
                label="Giới tính"
                required
                value={gender}
                choices={GENDER_CHOICES}
                onChange={(next) => setGender(next as Gender)}
                size="control"
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
                size="control"
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
              size="control"
            />
          ) : null}

          {duplicate === null ? null : (
            <div
              role="alert"
              className={cn(
                "grid gap-3 rounded-panel border p-3.5",
                DUPLICATE_COPY[duplicate.reason].soft
                  ? "border-vc-control bg-vc-tint"
                  : "border-destructive/35 bg-destructive/5",
              )}
            >
              <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-2.5">
                <CircleAlert
                  aria-hidden="true"
                  className={cn(
                    "mt-px size-[18px]",
                    DUPLICATE_COPY[duplicate.reason].soft ? "text-muted-foreground" : "text-destructive",
                  )}
                />
                <div>
                  <strong className="block text-xs font-semibold">
                    {DUPLICATE_COPY[duplicate.reason].title}
                  </strong>
                  <p className="mt-1 text-[11px] leading-[1.6] text-muted-foreground">
                    {DUPLICATE_COPY[duplicate.reason].body}
                  </p>
                </div>
              </div>

              <article className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-2.5 rounded-control border border-vc-control bg-card p-2.5">
                <GuardianInitials name={duplicate.name} />
                <div className="min-w-0">
                  <strong className="block truncate text-[11px] font-semibold">
                    {duplicate.name}
                  </strong>
                  <small className="block font-mono text-[10px] text-muted-foreground">
                    {duplicate.phone ?? "Chưa có số điện thoại"}
                  </small>
                </div>
              </article>

              {/* Each kind of clash gets the way out that fits it: nothing to do when
                  they are already on the roster, a correction when a number collides,
                  and a plain override when only the name does. */}
              <div className="flex flex-wrap gap-2">
                {duplicate.reason === "linked" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-control border-vc-control text-[11px]"
                    onClick={() => onOpenChange(false)}
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Đóng và xem danh sách
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      className="h-10 rounded-control text-[11px]"
                      onClick={linkDuplicate}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      Liên kết người này
                    </Button>
                    {duplicate.reason === "phone" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-control border-vc-control text-[11px]"
                        onClick={() => {
                          clearDuplicate();
                          document.getElementById("new-guardian-phone")?.focus();
                        }}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Sửa số điện thoại
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 rounded-control text-[11px]"
                        onClick={() => {
                          if (relationship !== undefined) {
                            commit({
                              profile_id: 0,
                              name: name.trim(),
                              phone: phone.trim(),
                              gender,
                              relationship,
                            });
                          }
                        }}
                      >
                        Vẫn tạo người mới
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

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
          <Button type="button" disabled={checking} onClick={() => void confirm()}>
            <Plus aria-hidden="true" className="size-4" />
            {checking ? "Đang kiểm tra…" : "Thêm vào hồ sơ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
