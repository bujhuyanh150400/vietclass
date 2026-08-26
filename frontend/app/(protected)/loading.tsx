import { DashboardSkeleton } from "@/modules/dashboard";

/**
 * Shows the dashboard-sized placeholder while a protected route segment loads,
 * so navigation inside the shell has immediate feedback.
 */
export default function ProtectedLoading() {
  return <DashboardSkeleton />;
}
