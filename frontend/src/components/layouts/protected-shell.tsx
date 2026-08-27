import type { ReactNode } from "react";

import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar, type NavigationItem } from "@/components/layouts/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Renders the frame every authenticated screen sits in: a collapsible sidebar
 * (a fixed rail on desktop, a drawer below the mobile breakpoint — both from
 * the shared `Sidebar` primitive) beside an inset content pane with its own
 * topbar. The account UI arrives as a slot so this shell stays free of
 * feature-module imports.
 */
export function ProtectedShell({
  navigation,
  accountMenu,
  defaultSidebarOpen,
  children,
}: {
  navigation: NavigationItem[];
  accountMenu: ReactNode;
  defaultSidebarOpen: boolean;
  children: ReactNode;
}) {
  const currentTitle =
    navigation.find((item) => item.current)?.label ?? "VietClasses";

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar navigation={navigation} accountMenu={accountMenu} />
      <SidebarInset>
        <AppHeader title={currentTitle} />
        <main className="grow px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
