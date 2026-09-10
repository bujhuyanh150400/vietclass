import type { ReactNode } from "react";

import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import "./app-shell.css";

/**
 * Renders the frame every authenticated screen sits in: a collapsible sidebar
 * (a fixed rail on desktop, a drawer below the mobile breakpoint — both from
 * the shared `Sidebar` primitive) beside an inset content pane with its own
 * topbar. The account UI arrives as a slot so this shell stays free of
 * feature-module imports.
 */
export function ProtectedShell({
  accountMenu,
  defaultSidebarOpen,
  children,
}: {
  accountMenu: ReactNode;
  defaultSidebarOpen: boolean;
  children: ReactNode;
}) {
  return (
    <SidebarProvider className="vc-app-shell" defaultOpen={defaultSidebarOpen}>
      <AppSidebar accountMenu={accountMenu} />
      <SidebarInset className="vc-app-sheet">
        <AppHeader />
        <main className="vc-app-content">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
