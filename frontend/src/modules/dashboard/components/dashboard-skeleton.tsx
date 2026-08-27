import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reserves the dashboard's heading, status card, and roadmap grid geometry
 * while the protected route segment loads, so navigating into it does not
 * shift the surrounding shell.
 */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-8" aria-hidden="true">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-32 w-full max-w-xl rounded-xl" />
      <div className="grid gap-3">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
