import type { ReactNode } from "react";

export type PageHeadingProps = {
  eyebrow?: ReactNode;
  title: string;
  description: ReactNode;
  badges?: ReactNode;
  action?: ReactNode;
};

/** Renders a reusable page title, description, optional badges, and optional action. */
export function PageHeading({
  eyebrow,
  title,
  description,
  badges,
  action,
}: PageHeadingProps) {
  return (
    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs text-muted-foreground">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h2 className="text-[29px] leading-tight font-semibold tracking-[-0.02em] md:text-[34px]">
            {title}
          </h2>
          {badges}
        </div>
        <p className="mt-2 max-w-[62ch] text-xs text-muted-foreground md:text-sm">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}
