import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Teaches tailwind-merge the theme keys `styles/theme.css` adds beyond Tailwind's
 * own scales.
 *
 * Without this it cannot tell that `rounded-control` and `rounded-md` set the same
 * property, so it keeps both and the winner is decided by stylesheet order — which
 * meant a caller's `rounded-control` lost to a component variant's `rounded-md`
 * silently, with the class present in the DOM and no effect on screen. Every key
 * registered in `@theme inline` has to be listed here to stay overridable.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["control", "panel", "sheet"],
      shadow: ["vc-sheet", "vc-raised"],
      color: [
        "vc-orange",
        "vc-orange-deep",
        "vc-gold",
        "vc-ink",
        "vc-paper",
        "vc-wood",
        "vc-ember",
        "vc-leaf",
        "vc-surface",
        "vc-surface-raised",
        "vc-line",
        "vc-text",
        "vc-text-muted",
        "vc-rule",
        "vc-control",
        "vc-tint",
      ],
    },
  },
});

/**
 * Merges conditional class names and resolves conflicting Tailwind utilities so
 * component variants and caller overrides produce one predictable class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { mapApiErrorToForm } from "./map-api-error-to-form";
export type { ApiFormErrorResult } from "./map-api-error-to-form";
export { personInitials } from "./person-initials";
