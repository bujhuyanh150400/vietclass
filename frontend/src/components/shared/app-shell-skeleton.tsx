import { Skeleton } from "@/components/ui/skeleton";

import "@/components/layouts/app-shell.css";

/**
 * Mirrors the protected shell's ruled sidebar, inset page sheet, topbar and
 * content scroll ownership while the authenticated shell resolves, so the page
 * does not shift once the real layout replaces it.
 *
 * It borrows the shell's own stylesheet for the sheet material and geometry
 * rather than restating them: a skeleton that drifts from the shell it stands
 * in for is worse than none. Only the parts that depend on live state — the
 * navigation copy and the account — are reduced to placeholder bars.
 *
 * The expanded sidebar is assumed because the cookie preference is not readable
 * here, and the whole thing stays non-interactive and out of the accessibility
 * tree.
 */
export function AppShellSkeleton() {
  return (
    <div className="vc-app-shell flex w-full" aria-hidden="true">
      <div className="hidden w-[14.75rem] shrink-0 md:block">
        <div className="vc-app-sidebar h-full shadow-[var(--vc-shell-shadow-sidebar)]">
          <div data-slot="sidebar-inner" className="flex h-full w-full flex-col">
            <div data-slot="sidebar-header" className="flex items-center gap-[9px]">
              <Skeleton className="size-[34px] rounded-[7px]" />
              <div className="grid gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>

            <div data-slot="sidebar-content" className="flex flex-1 flex-col">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton
                  key={row}
                  className="my-[3px] h-11 w-full rounded-[var(--vc-shell-radius-control)]"
                />
              ))}
            </div>

            <div data-slot="sidebar-footer">
              <div className="flex min-h-[58px] items-center gap-2.5 border-t border-[var(--vc-shell-rule)] pt-[13px]">
                <Skeleton className="size-9 rounded-[7px]" />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vc-app-sheet flex flex-1 flex-col">
        <div className="vc-app-header flex items-center gap-3">
          <Skeleton className="size-11 rounded-[var(--vc-shell-radius-control)]" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="vc-app-content">
          <Skeleton className="h-8 w-48 rounded-[var(--vc-shell-radius-control)]" />
          <Skeleton className="mt-6 h-32 w-full max-w-xl rounded-[var(--vc-shell-radius-panel)]" />
        </div>
      </div>
    </div>
  );
}
