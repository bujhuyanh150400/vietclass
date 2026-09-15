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
      { kind: "link", label: "Quản lý thư viện", href: "/system/files", icon: "files" },
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

/** One step in the path a reader took to reach the current screen. */
export type BreadcrumbCrumb = {
  label: string;
  /** Absent on the crumb naming the current screen, which is not a link to itself. */
  href?: string;
};

/**
 * The screens that live beneath a navigation destination, named exactly as their
 * own page metadata titles name them.
 *
 * A numeric segment in the key stands for any record identifier — `:id` — so one
 * entry covers every class, teacher and student. The labels are duplicated from
 * each route's `metadata.title` rather than derived from it because that metadata
 * is server-side and the topbar follows client-side navigation.
 */
const SUB_ROUTE_LABELS: Record<string, string> = {
  "/academic/subjects/new": "Thêm môn học",
  "/academic/subjects/:id": "Sửa môn học",
  "/academic/rooms/new": "Thêm phòng học",
  "/academic/rooms/:id": "Sửa phòng học",
  "/academic/classes/new": "Thêm lớp học",
  "/academic/classes/:id": "Chi tiết lớp học",
  "/academic/classes/:id/edit": "Sửa lớp học",
  "/academic/teachers/new": "Thêm giáo viên",
  "/academic/teachers/:id": "Sửa hồ sơ giáo viên",
  "/academic/students/new": "Thêm học sinh",
  "/academic/students/:id": "Sửa hồ sơ học sinh",
  "/academic/avatar": "Đổi ảnh đại diện",
};

/** Replaces every record identifier in a path with `:id`, to look it up as one route. */
function toRoutePattern(pathname: string): string {
  return pathname.replace(/\/\d+(?=\/|$)/g, "/:id");
}

/**
 * Returns the trail of crumbs leading to the given path.
 *
 * A list screen is one crumb, the same label the sidebar highlights. A screen
 * beneath it adds its own name, and every crumb above the last is a link back — so
 * a reader deep in "Sửa lớp học" can see they are inside "Lớp học" and get back to
 * it without the browser's own back button.
 *
 * Only paths this build actually ships are named. An unrecognised descendant falls
 * back to its parent's single crumb rather than inventing a label for it, which is
 * the behaviour the topbar had before it showed a trail at all.
 */
export function currentNavigationTrail(pathname: string): BreadcrumbCrumb[] {
  const pattern = toRoutePattern(pathname);
  const trail: BreadcrumbCrumb[] = [];

  for (const group of NAVIGATION) {
    for (const item of group.items) {
      if (item.kind === "upcoming" || !isCurrentPath(item, pathname)) {
        continue;
      }

      trail.push({ label: item.label, href: item.href });

      // Each ancestor between the list and the current screen that this build
      // names, so a three-deep route reads as three crumbs rather than two.
      const segments = pathname.slice(item.href.length).split("/").filter(Boolean);

      for (let depth = 1; depth <= segments.length; depth += 1) {
        const href = `${item.href}/${segments.slice(0, depth).join("/")}`;
        const label = SUB_ROUTE_LABELS[toRoutePattern(href)];

        if (label !== undefined) {
          trail.push({ label, href });
        }
      }

      // The current screen names itself; it is not a link back to itself.
      const last = trail[trail.length - 1];

      if (last !== undefined) {
        delete last.href;
      }

      return trail;
    }
  }

  const orphan = SUB_ROUTE_LABELS[pattern];

  return [{ label: orphan ?? "VietClasses" }];
}
