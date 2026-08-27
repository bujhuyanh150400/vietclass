import * as React from "react";

/** Below this width the sidebar switches to its mobile drawer presentation. */
const MOBILE_BREAKPOINT = 768;

/**
 * Tracks whether the viewport is narrower than the mobile breakpoint, so the
 * sidebar can switch between its desktop rail and its drawer.
 *
 * This is the upstream shadcn/ui implementation, kept deliberately: the value
 * decides whether mobile visitors get any navigation at all — below the
 * breakpoint the desktop rail is `display: none`, so a hook that never leaves
 * its server-side default would strand them with no menu. The lint rule below
 * is disabled rather than worked around, because the effect genuinely has to
 * take a first measurement on mount: the server has no viewport to read.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // The first measurement is only available on the client, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
