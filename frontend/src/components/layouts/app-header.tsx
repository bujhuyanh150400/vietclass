import type { ReactNode } from "react";

import type { NavigationItem } from "@/components/layouts/app-sidebar";
import { MobileNavigation } from "@/components/shared/mobile-navigation";

/**
 * Renders the fixed-height topbar: the mobile navigation trigger, the current
 * page title, and whatever account UI the caller supplies. The account UI is a
 * slot, so this layout never needs to know about the Identity module.
 */
export function AppHeader({
  title,
  navigation,
  accountMenu,
}: {
  title: string;
  navigation: NavigationItem[];
  accountMenu: ReactNode;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
      <MobileNavigation navigation={navigation} />
      <span className="text-sm font-medium">{title}</span>
      <div className="ml-auto flex items-center gap-2">{accountMenu}</div>
    </header>
  );
}
