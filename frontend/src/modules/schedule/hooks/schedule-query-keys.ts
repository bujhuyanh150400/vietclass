/**
 * The cache keys every schedule query is stored under.
 *
 * Fixed schedules have a `root` so one mutation can invalidate every class's list
 * at once, without a caller having to know which class is on screen.
 *
 * The two option keys sit under this module rather than under `academic` even
 * though the endpoints belong to Academic and Identity. That costs one extra
 * cache entry for the same options; it buys a schedule module that does not reach
 * into another module's internals to read them.
 */
export const scheduleQueryKeys = {
  templates: {
    root: () => ["schedule", "templates"] as const,
    list: (classId: number) => ["schedule", "templates", "list", classId] as const,
  },
  roomOptions: (search: string) => ["schedule", "room-options", search] as const,
  teacherOptions: (search: string) => ["schedule", "teacher-options", search] as const,
} as const;
