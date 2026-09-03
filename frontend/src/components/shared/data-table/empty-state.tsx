import { Inbox, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/index";

/**
 * Renders the inline "nothing here" placeholder for a list: an illustration or
 * icon, what's missing, and — when the screen has one — the action that gets past
 * it, such as clearing the filters that produced zero rows.
 *
 * `image` wins over `icon` when both are given; the mascot artwork is decorative,
 * so it carries no alt text of its own — the title next to it already says what's
 * missing.
 *
 * Sized for a table cell or a grid, not a full page — see NotFoundState and
 * RouteErrorState for the full-page equivalents.
 */
export function EmptyState({
  icon: Icon = Inbox,
  image,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  image?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid justify-items-center gap-3 px-6 py-10 text-center", className)}>
      {image ? (
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          width={128}
          height={128}
          className="size-32 object-contain"
        />
      ) : (
        <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      )}
      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
