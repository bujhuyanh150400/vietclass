import {
  BookOpen,
  DoorOpen,
  FolderOpen,
  GraduationCap,
  House,
  School,
  UserRound,
  Users,
} from "lucide-react";

/**
 * Icons a navigation item may request, kept closed so no arbitrary icon leaks in.
 */
export const NAVIGATION_ICONS = {
  home: House,
  subjects: BookOpen,
  rooms: DoorOpen,
  teachers: GraduationCap,
  classes: School,
  students: Users,
  parents: UserRound,
  files: FolderOpen,
} as const;

type NavigationItemBase = {
  label: string;
  icon: keyof typeof NAVIGATION_ICONS;
};

/** A navigation item backed by a route that the application currently ships. */
export type NavigationLinkItem = NavigationItemBase & {
  kind: "link";
  href: string;
};

/** A navigation item shown for a feature that is intentionally not routable yet. */
export type NavigationUpcomingItem = NavigationItemBase & {
  kind: "upcoming";
  badge: "Sắp có";
};

/** One routable or upcoming destination in the application navigation. */
export type NavigationItem = NavigationLinkItem | NavigationUpcomingItem;

/** A titled set of destinations, or an untitled one when `label` is absent. */
export type NavigationGroup = {
  label?: string;
  items: NavigationItem[];
};

/**
 * Every destination this build exposes, in the order they appear in the
 * sidebar. Upcoming items remain explicit so presentation code cannot create a
 * route or link for a feature that has not shipped.
 */
export const NAVIGATION: NavigationGroup[] = [
  {
    items: [
      { kind: "link", label: "Trang chủ", href: "/dashboard", icon: "home" },
    ],
  },
  {
    label: "Học vụ",
    items: [
      { kind: "link", label: "Môn học", href: "/academic/subjects", icon: "subjects" },
      { kind: "link", label: "Phòng học", href: "/academic/rooms", icon: "rooms" },
      { kind: "link", label: "Lớp học", href: "/academic/classes", icon: "classes" },
    ],
  },
  {
    label: "Người dùng",
    items: [
      { kind: "link", label: "Giáo viên", href: "/academic/teachers", icon: "teachers" },
      { kind: "link", label: "Học sinh", href: "/academic/students", icon: "students" },
      { kind: "upcoming", label: "Phụ huynh", badge: "Sắp có", icon: "parents" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { kind: "link", label: "Quản lý thư viện", href: "/files", icon: "files" },
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
export function isCurrentPath(item: NavigationLinkItem, pathname: string): boolean {
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
      if (item.kind === "upcoming") {
        continue;
      }

      if (isCurrentPath(item, pathname)) {
        return item.label;
      }
    }
  }

  return "VietClasses";
}
