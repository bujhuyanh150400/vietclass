import type { ReactNode } from "react";

import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar, type NavigationItem } from "@/components/layouts/app-sidebar";

/**
 * Renders the frame every authenticated screen sits in: a fixed 256px sidebar on
 * desktop, a 64px topbar with a drawer trigger below that breakpoint, and the
 * content region. The account UI arrives as a slot so this shell stays free of
 * feature-module imports.
 */
export function ProtectedShell({
  navigation,
  accountMenu,
  children,
}: {
  navigation: NavigationItem[];
  accountMenu: ReactNode;
  children: ReactNode;
}) {
  const currentTitle =
    navigation.find((item) => item.current)?.label ?? "VietClasses";

  return (
    <div className="flex min-h-svh grow bg-muted/40">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:block">
        <AppSidebar navigation={navigation} />
      </aside>

      <div className="flex min-w-0 grow flex-col">
        <AppHeader
          title={currentTitle}
          navigation={navigation}
          accountMenu={accountMenu}
        />
        <main className="grow px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
