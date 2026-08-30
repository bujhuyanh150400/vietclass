"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingState } from "./loading-state";

/** Builds the string a route change is detected against: the path plus its query. */
function locationKey(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
}

/**
 * Shows the shared loading overlay for client-side navigation inside the
 * protected shell — a companion to the automatic `loading.tsx` fallback, not a
 * replacement for it: `loading.tsx` still covers a hard navigation or the first
 * load, where nothing was clicked for this component to react to.
 *
 * A Suspense fallback is swapped for the real page in a single React commit with
 * no hook for the fallback to react to, so `loading.tsx` alone can show an
 * entrance but never a graceful exit. This component instead opens the instant an
 * internal link is clicked and closes once the URL has actually changed, so
 * `LoadingState` controls its own close timing and gets the fade-out and
 * minimum-visible time it was built for.
 */
export function RouteLoadingState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocation = locationKey(pathname, searchParams);

  const [open, setOpen] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState(currentLocation);

  // The navigation has actually landed once the location being watched changes,
  // mirroring the render-time "adjust state when a prop changes" pattern used
  // elsewhere (DataTableToolbar, LoadingState itself) instead of an extra effect
  // and the render it would cost.
  if (currentLocation !== appliedLocation) {
    setAppliedLocation(currentLocation);
    setOpen(false);
  }

  useEffect(() => {
    /**
     * Opens the overlay the instant a plain click on an internal link fires, ahead
     * of the navigation it starts. Listens on the capture phase so it runs before
     * Next's own `<Link>` handler further down the tree, which calls
     * `preventDefault()` on every client-side transition it takes over — checking
     * `defaultPrevented` here would otherwise skip the very clicks this exists for.
     */
    function handleClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");

      if (anchor === null || anchor === undefined) {
        return;
      }

      if (
        anchor.target !== "" ||
        anchor.hasAttribute("download") ||
        anchor.origin !== window.location.origin
      ) {
        return;
      }

      const destination = locationKey(anchor.pathname, new URLSearchParams(anchor.search));

      if (destination === currentLocation) {
        return;
      }

      setOpen(true);
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [currentLocation]);

  return <LoadingState open={open} />;
}
