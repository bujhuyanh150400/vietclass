/**
 * The cache keys every academic query is stored under.
 *
 * Each resource has a `root` so one mutation can invalidate every page and filter
 * of that resource at once, without having to know which page is on screen.
 */
export const academicQueryKeys = {
  subjects: {
    root: () => ["academic", "subjects"] as const,
    list: (params: object) => ["academic", "subjects", "list", params] as const,
    detail: (id: number) => ["academic", "subjects", "detail", id] as const,
    options: (search: string) => ["academic", "subjects", "options", search] as const,
  },
  rooms: {
    root: () => ["academic", "rooms"] as const,
    list: (params: object) => ["academic", "rooms", "list", params] as const,
    detail: (id: number) => ["academic", "rooms", "detail", id] as const,
    options: (search: string) => ["academic", "rooms", "options", search] as const,
  },
  teachers: {
    root: () => ["academic", "teachers"] as const,
    list: (params: object) => ["academic", "teachers", "list", params] as const,
    detail: (id: number) => ["academic", "teachers", "detail", id] as const,
    options: (search: string) => ["academic", "teachers", "options", search] as const,
  },
  classes: {
    root: () => ["academic", "classes"] as const,
    list: (params: object) => ["academic", "classes", "list", params] as const,
    detail: (id: number) => ["academic", "classes", "detail", id] as const,
    options: (search: string) => ["academic", "classes", "options", search] as const,
  },
  students: {
    root: () => ["academic", "students"] as const,
    list: (params: object) => ["academic", "students", "list", params] as const,
    detail: (id: number) => ["academic", "students", "detail", id] as const,
  },
  enrollments: {
    root: () => ["academic", "enrollments"] as const,
    list: (classId: number, params: object) =>
      ["academic", "enrollments", "list", classId, params] as const,
    available: (classId: number, params: object) =>
      ["academic", "enrollments", "available", classId, params] as const,
  },
} as const;
