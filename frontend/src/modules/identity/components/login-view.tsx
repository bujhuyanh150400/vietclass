import { GraduationCap } from "lucide-react";
import { type ReactNode } from "react";

import { LoginBrandPanel } from "./login-brand-panel";

/**
 * Renders the sign-in page layout and leaves form/session behavior to the slot
 * supplied by its container.
 */
export function LoginView({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh grow lg:grid-cols-2">
      <LoginBrandPanel />

      <main className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap aria-hidden="true" className="size-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              VietClasses
            </span>
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              Chào mừng trở lại
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Đăng nhập để tiếp tục quản lý lớp học của bạn.
            </p>
          </div>

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
