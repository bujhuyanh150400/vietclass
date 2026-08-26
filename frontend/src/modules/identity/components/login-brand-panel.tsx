import Image from "next/image";

import { LoginWordmark } from "./login-wordmark";

/**
 * Renders the desk column beside the login form on large screens: the wordmark,
 * the mascot lit by a lamp glow, and the product's one-line promise. It is
 * presentation only — no data and no interaction — so it stays a Server
 * Component.
 */
export function LoginBrandPanel() {
  return (
    <aside className="vc-desk relative hidden overflow-hidden text-vc-paper lg:flex lg:flex-col lg:px-14 lg:py-12">
      <div className="vc-rise relative z-10">
        <LoginWordmark tone="desk" />
      </div>

      {/* The mascot sits on the desk rather than floating in the panel: it is
          bottom-anchored in whatever space the wordmark and promise leave, and
          scaled with nearest-neighbour sampling so the pixel grid never softens.
          The absolute box is what gives the 1254px source a height to fit into
          instead of dictating one. */}
      <div className="relative z-0 min-h-0 flex-1 py-6">
        <Image
          src="/images/character-panel-login.webp"
          alt=""
          aria-hidden="true"
          width={1254}
          height={1254}
          priority
          unoptimized
          className="vc-pixels vc-hop absolute inset-0 size-full object-contain object-bottom"
        />
      </div>

      <div className="vc-rise vc-delay-3 relative z-10 max-w-md">
        <h2 className="text-[2.2rem] leading-[1.12] font-extrabold tracking-[-0.025em] text-balance">
          Quản lý lớp học,{" "}
          <span className="text-vc-orange text-nowrap">nhẹ nhàng</span> hơn mỗi
          ngày.
        </h2>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-pretty text-vc-paper/65">
          Một chỗ làm việc cho quản trị viên, giáo viên, nhân viên và học viên.
        </p>
      </div>
    </aside>
  );
}
