"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { currentNavigationTrail } from "@/components/layouts/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Renders the fixed-height topbar: the sidebar trigger (which toggles the
 * desktop rail and opens the mobile drawer) and the trail naming where the reader
 * currently is. It stays deliberately bare — the brand, navigation, and account
 * menu all live in the sidebar, so duplicating any of them here would only add
 * noise.
 *
 * The trail is derived from the live path, so it follows client-side navigation
 * for the same reason the sidebar highlight does. On a list screen it is a single
 * label, exactly as before; a screen beneath one adds its own name and turns the
 * labels above it into links back.
 *
 * The last crumb stays an `h1` because it is the only page-level heading most
 * screens have: dropping it to a span left Môn học, Phòng học, Lớp học, Giáo viên
 * and every form with no heading at all, which costs screen-reader users the
 * document outline. A screen that wants its own visible title therefore starts at
 * `h2` under this one. Moving the `h1` down into the screens is possible, but only
 * once every screen owns one — not before.
 */
export function AppHeader() {
  const pathname = usePathname();
  const trail = currentNavigationTrail(pathname);
  const current = trail[trail.length - 1];

  return (
    <header className="vc-app-header flex shrink-0 items-center gap-3">
      <SidebarTrigger />
      <nav aria-label="Đường dẫn" className="vc-app-breadcrumb flex min-w-0 items-center">
        {trail.slice(0, -1).map((crumb) => (
          <span key={crumb.href ?? crumb.label} className="flex min-w-0 items-center">
            <Link href={crumb.href ?? pathname} className="vc-app-breadcrumb-link">
              {crumb.label}
            </Link>
            <ChevronRight aria-hidden="true" className="vc-app-breadcrumb-separator" />
          </span>
        ))}
        <h1 className="vc-app-header-title text-foreground">{current?.label}</h1>
      </nav>
    </header>
  );
}
