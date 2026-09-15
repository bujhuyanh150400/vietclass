"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { DiceBearAvatar } from "../types/avatar";
import { adventurerGender, randomAdventurer } from "../utils/adventurer";
import { renderDiceBear } from "../utils/dicebear";
import { SampleAvatarPicker } from "./sample-avatar-picker";

/**
 * Picks a sample avatar, starting from whichever one the profile already has.
 *
 * It is a separate component so its draft lives exactly as long as the open dialog
 * does: mounting is what resets the draft, rather than an effect that watches the
 * open flag and writes state back during render.
 */
function SampleAvatarDraft({
  value,
  onOpenChange,
  onConfirm,
}: {
  value: DiceBearAvatar | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (avatar: DiceBearAvatar) => void;
}) {
  const [draft, setDraft] = useState<DiceBearAvatar>(() =>
    value?.style === "adventurer" ? value : randomAdventurer(adventurerGender(value)),
  );

  const gender = adventurerGender(draft);
  const preview = renderDiceBear(draft);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Chọn avatar mẫu</DialogTitle>
        <DialogDescription>
          Chọn giới tính, sau đó random đến khi tìm được avatar phù hợp.
        </DialogDescription>
      </DialogHeader>

      <div className="grid justify-items-center gap-4">
        <div className="size-[230px] max-w-full rounded-full border border-vc-rule bg-background">
          {preview === null ? null : (
            <Avatar className="size-full">
              <AvatarImage
                src={preview}
                alt={`Avatar Adventurer ${gender === "male" ? "nam" : "nữ"} đang xem trước`}
                className="object-contain"
              />
            </Avatar>
          )}
        </div>

        <SampleAvatarPicker value={draft} onChange={setDraft} idPrefix="dialog-avatar-gender" />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <Button
          type="button"
          onClick={() => {
            onConfirm(draft);
            onOpenChange(false);
          }}
        >
          <Check aria-hidden="true" />
          Dùng avatar này
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Lets a reader pick a sample avatar by gender and re-roll it until one fits.
 *
 * There is no option surface: Adventurer's seed already varies the face, the skin,
 * the eyes and the mouth, and the only thing worth deciding by hand is whether the
 * drawing reads as a boy or a girl. The choice is applied only on confirm, so
 * re-rolling never disturbs the avatar already on the profile.
 */
export function SampleAvatarDialog({
  open,
  onOpenChange,
  value,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DiceBearAvatar | null;
  onConfirm: (avatar: DiceBearAvatar) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <SampleAvatarDraft value={value} onOpenChange={onOpenChange} onConfirm={onConfirm} />
      </DialogContent>
    </Dialog>
  );
}
