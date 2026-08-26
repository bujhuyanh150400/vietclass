import { GraduationCap } from "lucide-react";

/**
 * Renders the academic brand column shown beside the login form on large
 * screens. It is presentation only — no data, no interaction, and no external
 * illustration — so it stays a Server Component.
 */
export function LoginBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:72px_72px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-primary-foreground/15 blur-3xl"
      />

      <div className="relative flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
          <GraduationCap className="size-6" />
        </span>
        <span className="text-lg font-semibold tracking-tight">VietClasses</span>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
          Quản lý lớp học, nhẹ nhàng hơn mỗi ngày.
        </h2>
        <p className="mt-4 text-base text-primary-foreground/80">
          Dành cho quản trị viên, giáo viên, nhân viên và học viên.
        </p>
      </div>

      <p className="relative text-sm text-primary-foreground/70">VietClasses</p>
    </aside>
  );
}
