"use client";

import { ImagePlus, Save, Trash2, Undo2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import type { AvatarDraft, AvatarValue } from "../types/avatar";
import { AvatarDraftField } from "./avatar-draft-field";
import { UserAvatar } from "./user-avatar";

/**
 * Changes the avatar on a profile that already exists.
 *
 * It picks an avatar exactly the way the create screens do — one 152px frame, a
 * toggle between an uploaded photo and a generated face — because a reader who has
 * seen one of those screens should not have to learn a second way of doing the same
 * thing. What it adds is the thing only an existing profile has: a picture already on
 * file, which must be visible before anything replaces it.
 *
 * So the block rests on that picture and does nothing until asked. `draft` is the
 * pending change and `null` means there is none, which is what keeps the save button
 * from offering to write back what is already stored. Removing the avatar is staged
 * the same way rather than applied on click, so one button commits and no button
 * surprises.
 *
 * Presentational: the upload, the validation and the mutation all stay in its
 * container.
 */
export function AvatarEditor({
  current,
  name,
  draft,
  canUpload,
  onDraftChange,
  onSave,
  isPending = false,
  error,
}: {
  /** The avatar stored on the profile right now. */
  current: AvatarValue;
  /** Whose avatar this is, for the initials shown when there is no picture. */
  name: string;
  /** The change waiting to be saved, or `null` while nothing has been chosen. */
  draft: AvatarDraft | null;
  /** Whether a file can be stored for this profile — see `AvatarDraftField`. */
  canUpload: boolean;
  onDraftChange: (draft: AvatarDraft | null) => void;
  onSave: () => void;
  isPending?: boolean;
  error?: string | null;
}) {
  const removing = draft?.type === "none";

  return (
    <section className="rounded-sheet border border-vc-rule bg-card shadow-vc-sheet">
      <div className="p-7 max-md:px-4 max-md:py-5">
        <div className="mb-[22px] grid gap-[3px]">
          <h2 className="text-lg leading-[1.45] font-semibold tracking-[-0.01em]">Ảnh đại diện</h2>
          {/* Said plainly because this block has its own save button and, on an edit
              screen, sits under a form that has another one. */}
          <p className="text-[11px] leading-[1.6] text-muted-foreground">
            Ảnh lưu riêng, chỉ áp dụng khi bấm Lưu ảnh đại diện.
          </p>

        </div>

        <div className="grid gap-4">
          {error === null || error === undefined ? null : (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {canUpload ? null : (
            <Alert>
              <AlertDescription>
                Hồ sơ chưa có tài khoản để sở hữu tệp, nên chỉ chọn được avatar mẫu.
              </AlertDescription>
            </Alert>
          )}

          {draft === null ? (
            <div className="grid justify-items-center gap-5 text-center">
              <div className="relative grid size-[152px] place-items-center rounded-full border border-vc-control bg-card shadow-[0_4px_0_var(--vc-shell-rule)]">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 rounded-full border border-dashed border-vc-rule"
                />
                <UserAvatar
                  value={current}
                  name={name}
                  alt="Ảnh đại diện đang dùng"
                  className="absolute inset-2 size-auto"
                  loading="eager"
                />
              </div>

              <div className="grid w-full max-w-[260px] gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="h-11 w-full rounded-control border-vc-control text-[11px]"
                  // An empty draft rather than the stored avatar: the picker offers an
                  // upload and a generated face, and neither can be built back out of
                  // a stored file id. Starting blank says so honestly.
                  onClick={() => onDraftChange({ type: "none" })}
                >
                  <ImagePlus aria-hidden="true" className="size-4" />
                  Đổi ảnh đại diện
                </Button>

                {current === null ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    className="h-9 w-full rounded-control text-[11px] text-muted-foreground"
                    onClick={() => onDraftChange({ type: "none" })}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    Gỡ ảnh, dùng chữ cái đầu
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid justify-items-center gap-3.5">
              <AvatarDraftField
                bare
                value={draft}
                name={name}
                allowUpload={canUpload}
                disabled={isPending}
                onChange={onDraftChange}
              />

              {!removing || current === null ? null : (
                <p className="max-w-[260px] text-center text-[10px] leading-[1.6] text-muted-foreground">
                  Chưa chọn ảnh mới, nên lưu bây giờ sẽ gỡ ảnh đang dùng.
                </p>
              )}

              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                className="h-9 rounded-control text-[11px] text-muted-foreground"
                onClick={() => onDraftChange(null)}
              >
                <Undo2 aria-hidden="true" className="size-4" />
                {current === null ? "Thôi, để sau" : "Giữ ảnh hiện tại"}
              </Button>

            </div>
          )}
        </div>
      </div>

      {/* The same bottom edge `FormSheet` gives a form, so the two blocks on an edit
          screen end the same way — but a plain row, because this is not a form and
          must never be submitted by the one above it. */}
      <div className="flex min-h-[78px] flex-wrap items-center justify-end gap-2.5 rounded-b-sheet border-t border-vc-rule px-5 py-4 max-md:px-4 max-md:py-3.5 lg:px-8">
        <Button
          type="button"
          disabled={isPending || draft === null}
          className="h-11 min-w-[155px] gap-2 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px]"
          onClick={onSave}
        >
          <Save aria-hidden="true" className="size-[19px]" />
          {isPending ? "Đang lưu…" : "Lưu ảnh đại diện"}
        </Button>
      </div>
    </section>
  );
}
