import Image from "next/image";
import { type ReactNode } from "react";

// Imported from inside the module rather than from the global stylesheet, so
// Next only serves these rules on the routes that render this view. The rules
// sit in `@layer components`, and cascade layers are document-global, so they
// still sort beneath every Tailwind utility no matter when the sheet loads.
import "../styles/login.css";

import { BrandMark } from "@/components/shared/brand-mark";

import { LoginBrandPanel } from "./login-brand-panel";

/**
 * Renders the sign-in page layout — a desk column and a squared-paper column
 * joined by a punched binding — and leaves form and session behavior to the slot
 * supplied by its container.
 */
export function LoginView({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh grow lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <LoginBrandPanel />

      {/* Compact desk band for small screens, where the two columns collapse to
          one and the mascot has no room to stand beside the form. */}
      <div className="vc-desk relative flex items-end justify-between gap-4 overflow-hidden px-6 pt-5 sm:px-10 lg:hidden">
        <BrandMark tone="desk" className="pb-6" />
        <Image
          src="/images/character-panel-login.webp"
          alt=""
          aria-hidden="true"
          width={1254}
          height={1254}
          priority
          unoptimized
          className="vc-pixels vc-hop -mr-4 h-24 w-auto shrink-0 object-contain sm:h-32"
        />
      </div>

      <main className="vc-paper vc-binding relative flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
        <div className="relative mx-auto w-full max-w-[26rem]">
          <div className="vc-rise vc-delay-1">
            <h1 className="text-[1.75rem] leading-tight font-extrabold tracking-[-0.02em] text-vc-text sm:text-[2rem]">
              Chào mừng trở lại
            </h1>
            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-pretty text-vc-text-muted">
              Đăng nhập để tiếp tục quản lý lớp học của bạn.
            </p>
          </div>

          <div className="vc-rise vc-delay-2 mt-9">{children}</div>
        </div>
      </main>
    </div>
  );
}
