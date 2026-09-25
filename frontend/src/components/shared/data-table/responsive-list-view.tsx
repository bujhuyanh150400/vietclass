import type { ReactNode } from "react";

import type { ListView } from "./view-popover";

/**
 * Switches between a list's explicit card view and its table view with a
 * narrow-screen card fallback. The domain components still own the markup for
 * each view; this only owns when each view is visible.
 */
export function ResponsiveListView({
  view,
  table,
  grid,
  mobile = grid,
  tableClassName = "hidden lg:block",
  mobileClassName = "lg:hidden",
}: {
  view: ListView;
  table: ReactNode;
  grid: ReactNode;
  mobile?: ReactNode;
  tableClassName?: string;
  mobileClassName?: string;
}) {
  if (view === "grid") {
    return grid;
  }

  return (
    <>
      <div className={tableClassName}>{table}</div>
      <div className={mobileClassName}>{mobile}</div>
    </>
  );
}
