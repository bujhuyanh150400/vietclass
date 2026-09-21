"use client";

import {
  EllipsisVertical,
  HousePlus,
  MonitorDown,
  Share,
  type LucideIcon,
} from "lucide-react";

import {
  InfoDialog,
  InfoDialogCloseAction,
} from "@/components/shared/info-dialog";

import type { InstallGuidePlatform } from "./pwa-install-platform";

type InstallGuidance = {
  icon: LucideIcon;
  platform: string;
  summary: string;
  steps: string[];
};

const INSTALL_GUIDANCE: Record<InstallGuidePlatform, InstallGuidance> = {
  ios: {
    icon: Share,
    platform: "Trên iPhone hoặc iPad",
    summary: "Thêm VietClasses vào Màn hình chính để mở như một ứng dụng.",
    steps: [
      "Nhấn nút Chia sẻ trong Safari.",
      "Cuộn xuống rồi chọn Thêm vào Màn hình chính.",
      "Chọn Thêm để hoàn tất.",
    ],
  },
  android: {
    icon: EllipsisVertical,
    platform: "Trên Android với Chrome",
    summary: "Bạn vẫn có thể cài VietClasses từ menu Chrome.",
    steps: [
      "Mở menu ⋮ ở góc trên của Chrome.",
      "Chọn Cài đặt ứng dụng hoặc Thêm vào màn hình chính.",
      "Xác nhận cài VietClasses.",
    ],
  },
  desktop: {
    icon: MonitorDown,
    platform: "Trên máy tính",
    summary: "Cài VietClasses từ thanh địa chỉ hoặc menu trình duyệt.",
    steps: [
      "Chọn biểu tượng Cài đặt cạnh thanh địa chỉ.",
      "Hoặc mở menu trình duyệt.",
      "Chọn Cài đặt VietClasses.",
    ],
  },
};

/** Renders the approved platform-specific fallback instructions for installation. */
export function InstallAppDialog({
  open,
  onOpenChange,
  platform,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: InstallGuidePlatform;
}) {
  const guidance = INSTALL_GUIDANCE[platform];
  const PlatformIcon = guidance.icon;

  return (
    <InfoDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cài VietClasses"
      description={`Hướng dẫn cài VietClasses ${guidance.platform.toLowerCase()}.`}
      footer={<InfoDialogCloseAction />}
      className="sm:max-w-xl"
    >
      <div className="grid gap-5">
        <div className="flex items-center gap-3 rounded-panel border border-vc-control bg-vc-paper p-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-control border border-vc-control bg-vc-surface-raised text-vc-orange-deep">
            <PlatformIcon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-vc-text">{guidance.platform}</p>
            <p className="mt-0.5 text-xs text-vc-text-muted">
              Prompt cài đặt tự động chưa xuất hiện trong trình duyệt này.
            </p>
          </div>
        </div>

        <p className="text-sm leading-6 text-vc-text-muted">{guidance.summary}</p>

        <ol className="relative grid gap-1 before:absolute before:bottom-7 before:left-4 before:top-7 before:w-px before:bg-vc-rule">
          {guidance.steps.map((step, index) => (
            <li key={step} className="relative grid grid-cols-[32px_1fr] gap-3 py-2">
              <span className="z-10 grid size-8 place-items-center rounded-full border border-vc-wood bg-vc-orange font-mono text-[11px] font-bold text-vc-ink shadow-vc-raised">
                {index + 1}
              </span>
              <span className="pt-1.5 text-sm leading-5">{step}</span>
            </li>
          ))}
        </ol>

        <p className="flex items-start gap-2 border-l-3 border-vc-orange bg-vc-tint px-3 py-2.5 text-xs leading-5 text-vc-text-muted">
          <HousePlus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vc-orange-deep" />
          Khi browser hiển thị prompt cài đặt riêng, VietClasses sẽ ưu tiên prompt đó.
        </p>
      </div>
    </InfoDialog>
  );
}
