import type { ReactNode } from "react";

import { BackLink } from "@/components/shared/back-link";

/**
 * Renders the heading of a management screen: what the screen is, one line of
 * context, and the actions that belong to the screen as a whole.
 *
 * A screen reached from a list also passes `backHref`, which puts the way back
 * above the title — the same place on every screen, so it never has to be hunted
 * for. A list screen omits it and keeps the heading exactly as it was.
 */
export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const heading = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );

  if (backHref === undefined) {
    return heading;
  }

  return (
    <div className="grid gap-2">
      <BackLink href={backHref} label={backLabel ?? "Quay lại"} />
      {heading}
    </div>
  );
}
