import * as React from "react"

import { cn } from "@/lib/utils/index"

export type InputSize = "compact" | "default" | "control"

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  /** Numeric values keep the native HTML input width API available. */
  size?: InputSize | number
}

/**
 * Renders a single-line text field with shared geometry presets. The default
 * remains the compact shadcn control; `control` is the 44px OpenDesign field
 * used by the redesigned forms.
 */
function Input({ className, type, size = "default", ...props }: InputProps) {
  const nativeSize = typeof size === "number" ? size : undefined
  const sizeClassName =
    typeof size === "number"
      ? undefined
      : size === "control"
        ? "h-11 rounded-control border-vc-control bg-card text-[13px] md:text-[13px]"
        : size === "compact"
          ? "h-8 rounded-control border-vc-control text-xs md:text-xs"
          : undefined

  return (
    <input
      type={type}
      size={nativeSize}
      data-slot="input"
      data-size={typeof size === "string" ? size : undefined}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        sizeClassName,
        className,
      )}
      {...props}
    />
  )
}

export { Input }
