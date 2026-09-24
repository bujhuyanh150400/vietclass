export type ClassDetailTab = "overview" | "students" | "schedule" | "sessions";
export type ClassRosterTab = "current" | "past";
export type StudentDetailTab = "profile" | "classes" | "rewards" | "reports";

const CLASS_DETAIL_TABS: readonly ClassDetailTab[] = [
  "overview",
  "students",
  "schedule",
  "sessions",
];

const STUDENT_DETAIL_TABS: readonly StudentDetailTab[] = [
  "profile",
  "classes",
  "rewards",
  "reports",
];

/** Resolve the URL-addressable class panel, defaulting invalid values to overview. */
export function classDetailTab(value: string | null): ClassDetailTab {
  return CLASS_DETAIL_TABS.find((tab) => tab === value) ?? "overview";
}

/** Resolve the roster sub-tab without allowing stale URL values to blank the roster. */
export function classRosterTab(value: string | null): ClassRosterTab {
  return value === "past" ? "past" : "current";
}

/** Map the removed student history tab to the supported classes panel. */
export function studentDetailTab(value: string | null): StudentDetailTab {
  if (value === "history") return "classes";

  return STUDENT_DETAIL_TABS.find((tab) => tab === value) ?? "profile";
}
