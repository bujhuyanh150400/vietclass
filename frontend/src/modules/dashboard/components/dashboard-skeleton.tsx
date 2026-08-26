import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reserves the dashboard's heading and card geometry while the protected route
 * segment loads, so navigating into it does not shift the surrounding shell.
 */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-hidden="true">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-32 w-full max-w-xl rounded-xl" />
    </div>
  );
}
