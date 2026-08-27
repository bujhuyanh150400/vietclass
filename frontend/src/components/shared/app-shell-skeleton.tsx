import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors the protected shell's inset sidebar, topbar, and content geometry
 * while the authenticated shell resolves, so the page does not shift once the
 * real layout replaces it. Always approximates the sidebar's expanded width,
 * since the visitor's collapsed/expanded preference is not yet known this
 * early in the render.
 */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full" aria-hidden="true">
      <div className="hidden w-64 shrink-0 p-2 lg:block">
        <div className="flex h-full flex-col gap-2 rounded-lg bg-sidebar p-2">
          <div className="flex items-center gap-2 p-1.5">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="mt-4 grid gap-1 px-2">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 grow flex-col lg:m-2 lg:ml-0">
        <div className="flex h-16 shrink-0 items-center gap-3 rounded-t-xl border-b bg-background px-4 sm:px-6">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-32" />
        </div>
        <div className="grow rounded-b-xl border border-t-0 bg-background px-4 py-6 sm:px-6 sm:py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-32 w-full max-w-xl rounded-xl" />
        </div>
      </div>
    </div>
  );
}
