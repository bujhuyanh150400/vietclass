import type { ReactNode } from "react";

/**
 * Renders a list screen's controls, rows, and pager as one sheet of paper
 * instead of three separate cards.
 *
 * The regions are divided by printed rules rather than by gaps, so the toolbar
 * reads as belonging to the rows it filters — a gap between them would suggest
 * two unrelated panels. Every region is optional except the content, because a
 * screen showing an empty or failed state has no conditions or pager to offer.
 *
 * The sheet itself does not clip: a popover opened from the toolbar has to be
 * able to escape it. Anything inside that needs to scroll — a wide table — owns
 * its own scroll container.
 */
export function ListSheet({
  toolbar,
  conditions,
  children,
  pager,
}: {
  toolbar: ReactNode;
  conditions?: ReactNode;
  children: ReactNode;
  pager?: ReactNode;
}) {
  return (
    <div className="rounded-sheet border border-vc-rule bg-card shadow-vc-sheet">
      <div className="relative border-b border-vc-rule px-4 py-3.5">{toolbar}</div>

      {conditions ? (
        <div className="border-b border-vc-rule bg-background px-4 py-2">{conditions}</div>
      ) : null}

      <div className="min-w-0">{children}</div>

      {pager ? <div className="border-t border-vc-rule px-4 py-3">{pager}</div> : null}
    </div>
  );
}
