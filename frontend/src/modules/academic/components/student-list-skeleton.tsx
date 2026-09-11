/**
 * Stands in for the student table while the first page loads.
 *
 * It mirrors the real table's geometry — the same six column ratios and the same
 * 72px rows — so the rows do not jump when the data replaces it. The bars are
 * given uneven widths down the column because a grid of identical bars reads as
 * a rendering fault rather than as loading.
 *
 * Below the table's breakpoint it collapses to the two columns the cards show,
 * since that is what will actually appear.
 */
export function StudentListSkeleton() {
  return (
    <div aria-hidden="true" className="px-4">
      <div className="grid min-h-[43px] grid-cols-[1fr_90px] items-center gap-3.5 border-b border-vc-rule md:grid-cols-[2.1fr_0.45fr_2.1fr_1.8fr_1fr_40px]">
        {Array.from({ length: 6 }, (_, column) => (
          <SkeletonBar key={column} column={column} short />
        ))}
      </div>

      {Array.from({ length: 6 }, (_, row) => (
        <div
          key={row}
          className="grid min-h-[72px] grid-cols-[1fr_90px] items-center gap-3.5 border-b border-vc-rule last:border-b-0 md:grid-cols-[2.1fr_0.45fr_2.1fr_1.8fr_1fr_40px]"
        >
          {Array.from({ length: 6 }, (_, column) => (
            <SkeletonBar key={column} column={column} short={column === row % 5} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders one placeholder bar, hidden in the columns the narrow layout drops.
 *
 * Only the first column and the account column survive below the table's
 * breakpoint, matching the two-column grid the rows fall back to.
 */
function SkeletonBar({ column, short }: { column: number; short: boolean }) {
  const keptWhenNarrow = column === 0 || column === 4;

  return (
    <span
      className={`h-3 animate-pulse rounded-control bg-vc-rule ${short ? "w-[55%]" : "w-full"} ${
        keptWhenNarrow ? "" : "hidden md:block"
      }`}
    />
  );
}
