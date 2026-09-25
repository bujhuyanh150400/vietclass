import type { ReactNode } from "react";

import { cn } from "@/lib/utils/index";

/** Renders the shared full-page recovery layout with a caller-supplied message and action. */
export function FullPageState({
  icon,
  tone = "neutral",
  eyebrow,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  tone?: "neutral" | "destructive";
  eyebrow?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="grid min-h-[50svh] place-items-center px-4 py-10">
      <div className="grid max-w-md justify-items-center gap-5 text-center">
        <div
          className={cn(
            "grid size-12 place-items-center rounded-full",
            tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
        <div className="grid gap-2">
          {eyebrow ? <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
