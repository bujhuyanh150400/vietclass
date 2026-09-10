"use client";

import { usePathname } from "next/navigation";

import { currentNavigationLabel } from "@/components/layouts/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Renders the fixed-height topbar: the sidebar trigger (which toggles the
 * desktop rail and opens the mobile drawer) and the current page title. It
 * stays deliberately bare — the brand, navigation, and account menu all live
 * in the sidebar, so duplicating any of them here would only add noise.
 *
 * The title is derived from the live path, so it follows client-side navigation
 * for the same reason the sidebar highlight does.
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
