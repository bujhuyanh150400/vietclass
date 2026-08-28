import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
} from "lucide-react";

/**
 * Icons a navigation item may request, kept closed so no arbitrary icon leaks in.
 */
export const NAVIGATION_ICONS = {
  dashboard: LayoutDashboard,
  subjects: BookOpen,
  teachers: GraduationCap,
  classes: School,
  students: Users,
} as const;

/** One destination in the application navigation. */
export type NavigationItem = {
  href: string;
  label: string;
  icon: keyof typeof NAVIGATION_ICONS;
};

/** A titled set of destinations, or an untitled one when `label` is absent. */
export type NavigationGroup = {
  label?: string;
  items: NavigationItem[];
};

/**
 * Every destination this build actually ships, in the order they appear in the
 * sidebar. Academic screens follow the dependency order the data has: a class
 * needs a subject and a teacher before it can exist.
 */
export const NAVIGATION: NavigationGroup[] = [
  {
    items: [{ href: "/dashboard", label: "Tổng quan", icon: "dashboard" }],
  },
  {
    label: "Học vụ",
    items: [
      { href: "/academic/subjects", label: "Môn học", icon: "subjects" },
      { href: "/academic/teachers", label: "Giáo viên", icon: "teachers" },
      { href: "/academic/classes", label: "Lớp học", icon: "classes" },
      { href: "/academic/students", label: "Học sinh", icon: "students" },
    ],
  },
];

/**
 * Reports whether a navigation item is the one the given path is inside.
 *
 * A descendant route counts as being on its parent item — a class detail page is
 * still "Lớp học" — except for `/dashboard`, which would otherwise look current
 * for every dashboard descendant.
 */
export function isCurrentPath(item: NavigationItem, pathname: string): boolean {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Returns the label of the destination the given path belongs to, falling back to
 * the product name when the path is outside the navigation entirely.
 */
export function currentNavigationLabel(pathname: string): string {
  for (const group of NAVIGATION) {
    for (const item of group.items) {
      if (isCurrentPath(item, pathname)) {
        return item.label;
      }
    }
  }

  return "VietClasses";
}
