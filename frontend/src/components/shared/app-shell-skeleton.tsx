import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the protected shell's sidebar, topbar, and content geometry while the
 * authenticated shell resolves, so the page does not shift once the real layout
 * replaces it.
 */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh grow bg-muted/40" aria-hidden="true">
      <div className="hidden w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
        <div className="flex items-center gap-3 px-2 py-1">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-6 grid gap-1">
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="flex min-w-0 grow flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
          <Skeleton className="size-9 rounded-md lg:hidden" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto size-9 rounded-full" />
        </div>
        <div className="grow px-4 py-6 sm:px-6 sm:py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-40 w-full max-w-xl rounded-xl" />
        </div>
      </div>
    </div>
  );
}
