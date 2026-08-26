import { cn } from "@/lib/utils";

/**
 * Renders the product wordmark. The name is set in a bitmap face so the brand
 * speaks at the same resolution as the mascot artwork; the leading square is a
 * single enlarged pixel from that same grid. The `tone` picks the palette for
 * the dark desk column or the light paper column.
 */
export function LoginWordmark({
  tone,
  className,
}: {
  tone: "desk" | "paper";
  className?: string;
}) {
  return (
    <p className={cn("flex items-center gap-3", className)}>
      <span aria-hidden="true" className="size-3.5 bg-vc-orange" />
      <span
        className={cn(
          "font-pixel text-[0.95rem] leading-none tracking-[0.06em]",
          tone === "desk" ? "text-vc-paper" : "text-vc-text",
        )}
      >
        VIETCLASSES
      </span>
    </p>
  );
}
