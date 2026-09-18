/** Keeps the sheet's geometry stable while the first teacher page is loading. */
export function TeacherListSkeleton() {
  return (
    <div className="grid divide-y divide-vc-rule p-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid grid-cols-[minmax(220px,1.4fr)_1.1fr_1fr_1fr_0.8fr_40px] gap-4 px-3 py-5">
          <div className="flex items-center gap-3">
            <span className="size-11 animate-pulse rounded-full bg-muted" />
            <span className="grid flex-1 gap-2">
              <span className="h-3 w-36 animate-pulse rounded bg-muted" />
              <span className="h-2 w-24 animate-pulse rounded bg-muted" />
            </span>
          </div>
          <span className="h-8 w-32 animate-pulse self-center rounded bg-muted" />
          <span className="h-7 w-28 animate-pulse self-center rounded bg-muted" />
          <span className="h-7 w-24 animate-pulse self-center rounded bg-muted" />
          <span className="h-3 w-20 animate-pulse self-center rounded bg-muted" />
          <span className="size-8 animate-pulse self-center rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
