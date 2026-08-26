import Link from "next/link";
import { GraduationCap, LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";

/** Icons a navigation item may request, kept closed so no arbitrary icon leaks in. */
const NAVIGATION_ICONS = {
  dashboard: LayoutDashboard,
} as const;

/** One entry in the application navigation. */
export type NavigationItem = {
  href: string;
  label: string;
  icon: keyof typeof NAVIGATION_ICONS;
  current: boolean;
};

/**
 * Renders the application wordmark and navigation list. It is shared by the
 * fixed desktop sidebar and the mobile drawer, so both always offer the same
 * destinations and mark the active one for assistive technology.
 */
export function AppSidebar({
  navigation,
  onNavigate,
}: {
  navigation: NavigationItem[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-md px-2 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap aria-hidden="true" className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight">
          VietClasses
        </span>
      </Link>

      <nav aria-label="Điều hướng chính" className="grid gap-1">
        {navigation.map((item) => {
          const Icon = NAVIGATION_ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={item.current ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                item.current
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
