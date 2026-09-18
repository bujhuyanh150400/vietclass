import * as React from "react"

import { cn } from "@/lib/utils/index"

export type TextareaSize = "default" | "control"

/**
 * Renders a multi-line text field sharing the border, focus, and invalid-state
 * styling of the single-line input. `control` matches the OpenDesign form field.
 */
function Textarea({ className, size = "default", ...props }: React.ComponentProps<"textarea"> & {
  size?: TextareaSize
}) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        size === "control" &&
          "min-h-[88px] rounded-control border-vc-control bg-card text-[13px] md:text-[13px]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
