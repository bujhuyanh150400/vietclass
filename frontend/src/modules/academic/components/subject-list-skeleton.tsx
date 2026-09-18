/** Stands in for the subject table while its first page is loading. */
export function SubjectListSkeleton() {
  return (
    <div aria-hidden="true" className="px-4">
      <div className="grid min-h-[43px] grid-cols-[1fr_90px] items-center gap-3.5 border-b border-vc-rule lg:grid-cols-[2fr_1.7fr_.8fr_1fr_40px]">
        {Array.from({ length: 5 }, (_, column) => (
          <SkeletonBar key={column} column={column} short />
        ))}
      </div>

      {Array.from({ length: 6 }, (_, row) => (
        <div
          key={row}
          className="grid min-h-[68px] grid-cols-[1fr_90px] items-center gap-3.5 border-b border-vc-rule last:border-b-0 lg:grid-cols-[2fr_1.7fr_.8fr_1fr_40px]"
        >
          {Array.from({ length: 5 }, (_, column) => (
            <SkeletonBar key={column} column={column} short={column === row % 4} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonBar({ column, short }: { column: number; short: boolean }) {
  const keptWhenNarrow = column === 0 || column === 3;

  return (
    <span
      className={`h-3 animate-pulse rounded-control bg-vc-rule ${short ? "w-[55%]" : "w-full"} ${
        keptWhenNarrow ? "" : "hidden lg:block"
      }`}
    />
  );
}
