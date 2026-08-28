import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reserves the heading, toolbar, and table geometry of Academic screens while
 * their nested route segment is loading inside the authenticated shell.
 */
export default function AcademicLoading() {
  return (
    <div aria-hidden="true" className="grid gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-72" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
}
