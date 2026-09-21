export type InstallGuidePlatform = "ios" | "android" | "desktop";

/** Selects platform-specific install instructions from browser identity signals. */
export function getInstallGuidePlatform(
  userAgent: string,
  maxTouchPoints: number,
): InstallGuidePlatform {
  if (/(iPhone|iPad|iPod)/i.test(userAgent)) {
    return "ios";
  }

  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) {
    return "ios";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  return "desktop";
}
