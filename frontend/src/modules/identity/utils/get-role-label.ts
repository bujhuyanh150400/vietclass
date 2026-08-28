import type { UserRole } from "../types/auth";

/**
 * Returns the Vietnamese label shown for a role. The exhaustive match makes a
 * newly added role a compile error rather than an unlabelled account.
 */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 0:
      return "Quản trị viên";
    case 1:
      return "Giáo viên";
    case 2:
      return "Học viên";
    case 3:
      return "Phụ huynh";
  }
}
