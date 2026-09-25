import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/index";

export type InlineBadgeSize = "sm" | "md" | "lg" | "xl" | "xxl";
export type InlineBadgeType = "neutral" | "muted" | "success" | "danger" | "primary";

export type InlineBadgeProps = ComponentProps<"span"> & {
  size?: InlineBadgeSize;
  type?: InlineBadgeType;
};

const SIZE_CLASSES: Record<InlineBadgeSize, string> = {
  sm: "min-h-[25px] px-2 py-0.5 text-[10px]",
  md: "min-h-[29px] px-2.5 py-1 text-xs",
  lg: "min-h-[32px] px-3 py-1.5 text-sm",
  xl: "min-h-[36px] px-3.5 py-2 text-sm",
  xxl: "min-h-[44px] px-4 py-2.5 text-base",
};

const TYPE_CLASSES: Record<InlineBadgeType, string> = {
  neutral: "border-vc-rule bg-background text-muted-foreground",
  muted: "border-vc-control bg-vc-tint text-muted-foreground",
  success: "border-vc-leaf/30 bg-vc-leaf/10 text-vc-leaf",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  primary: "border-vc-orange bg-vc-orange text-vc-ink",
};

/** Compact inline label for counts and other metadata, independent of page headings. */
export function InlineBadge({
  size = "sm",
  type = "neutral",
  className,
  ...props
}: InlineBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border font-mono leading-none",
        SIZE_CLASSES[size],
        TYPE_CLASSES[type],
        className,
      )}
      {...props}
    />
  );
}
