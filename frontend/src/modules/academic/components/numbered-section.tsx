import type { ReactNode } from "react";

import { cn } from "@/lib/utils/index";

/**
 * Heads one block of a form sheet with its position, name, and a one-line reason
 * its fields belong together.
 *
 * The number is what makes a long form legible: a reader who is told there are four
 * blocks and is looking at `03` knows where they are, which a run of identical
 * headings cannot tell them. It is set in the monospace face the design system
 * reserves for fixed-width data, in a small bordered chip, so it reads as a
 * position marker rather than as content.
 *
 * Consecutive sections are separated by a rule rather than by a gap, matching how
 * the list sheet separates its regions.
 */
export function NumberedSection({
  index,
  title,
  description,
  className,
  children,
}: {
  index: number;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("[&+&]:mt-[30px] [&+&]:border-t [&+&]:border-vc-rule [&+&]:pt-[30px]", className)}>
      <div className="mb-[22px] grid grid-cols-[34px_minmax(0,1fr)] items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-7 w-8 place-items-center rounded-[4px] border border-vc-control bg-card font-mono text-[10px] leading-none font-medium tracking-[0.06em]"
        >
          {String(index).padStart(2, "0")}
        </span>
        <div className="pt-0.5">
          <h2 className="text-lg leading-[1.45] font-semibold tracking-[-0.01em]">{title}</h2>
          <p className="mt-[3px] text-[11px] leading-[1.6] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
