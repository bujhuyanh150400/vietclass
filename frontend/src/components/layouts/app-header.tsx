"use client";

import { usePathname } from "next/navigation";

import { currentNavigationLabel } from "@/components/layouts/navigation";
import { Separator } from "@/components/ui/separator";
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
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <h1 className="text-sm font-semibold text-foreground">
        {currentNavigationLabel(pathname)}
      </h1>
    </header>
  );
}
