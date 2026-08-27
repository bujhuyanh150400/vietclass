import { BarChart3, BookOpen, ClipboardCheck, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** One classroom-management capability this build previews but does not ship yet. */
type RoadmapFeature = {
  label: string;
  description: string;
  icon: LucideIcon;
};

/**
 * Features named openly rather than left implicit, so a visitor can see where
 * the product is headed instead of finding a dead end. Order is unordered —
 * none of these has priority over the others — so the grid carries no
 * numbering.
 */
const ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    label: "Lớp học",
    description: "Tạo lớp học, xếp lịch và quản lý sĩ số.",
    icon: BookOpen,
  },
  {
    label: "Học viên",
    description: "Lưu hồ sơ học viên và theo dõi quá trình học.",
    icon: Users,
  },
  {
    label: "Điểm danh",
    description: "Điểm danh từng buổi học và xem lại lịch sử.",
    icon: ClipboardCheck,
  },
  {
    label: "Báo cáo",
    description: "Xem báo cáo tiến độ lớp học theo thời gian.",
    icon: BarChart3,
  },
];

/**
 * Renders one upcoming feature as a dashed, unfinished-looking card — the
 * dashed edge reads as "drafted, not yet built", which is what the section
 * heading above already states in words, so the card needs no badge of its
 * own repeating it.
 */
function RoadmapCard({ label, description, icon: Icon }: RoadmapFeature) {
  return (
    <Card className="gap-3 border-2 border-dashed bg-transparent py-5 shadow-none">
      <CardHeader className="gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <CardTitle className="text-sm">{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * Renders the dashboard landing content: a welcome, the one status that is
 * always true post-login, and an honest preview of the classroom-management
 * features still to come — no invented metrics standing in for data this
 * build does not have yet.
 */
export function DashboardView() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chào mừng trở lại!
        </h1>
        <p className="text-sm text-muted-foreground">
          Đây sẽ là nơi bạn theo dõi lớp học, khi các tính năng bên dưới lần
          lượt ra mắt.
        </p>
      </div>

      <Card className="max-w-xl gap-3 py-5">
        <CardHeader className="gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles aria-hidden="true" className="size-4.5" />
          </span>
          <CardTitle>Hệ thống đã sẵn sàng</CardTitle>
          <CardDescription>
            Bạn đã đăng nhập thành công vào VietClasses. Các tính năng quản lý
            lớp học sẽ lần lượt ra mắt — xem trước bên dưới.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Sắp ra mắt
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROADMAP_FEATURES.map((feature) => (
            <RoadmapCard key={feature.label} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
}
