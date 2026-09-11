"use client";

import { usePathname } from "next/navigation";

import { currentNavigationLabel } from "@/components/layouts/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Renders the fixed-height topbar: the sidebar trigger (which toggles the
 * desktop rail and opens the mobile drawer) and a label naming where the reader
 * currently is. It stays deliberately bare — the brand, navigation, and account
 * menu all live in the sidebar, so duplicating any of them here would only add
 * noise.
 *
 * The title is derived from the live path, so it follows client-side navigation
 * for the same reason the sidebar highlight does.
 *
 * It stays an `h1` because it is the only page-level heading most screens have:
 * dropping it to a span left Môn học, Phòng học, Lớp học, Giáo viên and every form
 * with no heading at all, which costs screen-reader users the document outline.
 * A screen that wants its own visible title therefore starts at `h2` under this
 * one. Moving the `h1` down into the screens is possible, but only once every
 * screen owns one — not before.
 */
export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="vc-app-header flex shrink-0 items-center gap-3">
      <SidebarTrigger />
      <h1 className="vc-app-header-title text-foreground">
        {currentNavigationLabel(pathname)}
      </h1>
    </header>
  );
}
