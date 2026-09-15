"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils/index";

import type { DiceBearAvatar } from "../types/avatar";
import { adventurerGender, randomAdventurer, type AvatarGender } from "../utils/adventurer";

const GENDER_CHOICES: { value: AvatarGender; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
];

/**
 * The controls that choose a sample avatar: a gender, and a re-roll.
 *
 * It draws no preview of its own. One caller shows the result in a dialog at 230px,
 * another in the 152px portrait a profile form already has — so the picture belongs to
 * whoever owns the layout, and this owns only the choosing.
 *
 * `idPrefix` keeps the radio ids unique when more than one of these is on a page.
 */
export function SampleAvatarPicker({
  value,
  onChange,
  disabled = false,
  idPrefix = "avatar-gender",
  className,
}: {
  value: DiceBearAvatar;
  onChange: (value: DiceBearAvatar) => void;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
}) {
  const gender = adventurerGender(value);

  return (
    <div className={cn("grid w-full justify-items-center gap-3", className)}>
      <RadioGroup
        className="w-full grid-cols-2"
        value={gender}
        aria-label="Giới tính avatar"
        disabled={disabled}
        onValueChange={(next) => onChange(randomAdventurer(next as AvatarGender))}
      >
        {GENDER_CHOICES.map((choice) => (
          <label
            key={choice.value}
            htmlFor={`${idPrefix}-${choice.value}`}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-control border text-xs font-semibold",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
              gender === choice.value
                ? "border-vc-ink bg-vc-ink text-vc-paper"
                : "border-vc-control bg-card text-foreground hover:bg-vc-tint",
            )}
          >
            <RadioGroupItem
              id={`${idPrefix}-${choice.value}`}
              value={choice.value}
              className={cn(
                "border-vc-control",
                gender === choice.value && "border-vc-paper [&_svg]:fill-vc-paper",
              )}
            />
            {choice.label}
          </label>
        ))}
      </RadioGroup>

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="h-11 w-full rounded-control border-vc-control text-[11px]"
        onClick={() => onChange(randomAdventurer(gender))}
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        Random avatar
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        Adventurer của{" "}
        <a
          href="https://www.instagram.com/lischi_art/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Lisa Wischofsky
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          CC BY 4.0
        </a>
      </p>
    </div>
  );
}
