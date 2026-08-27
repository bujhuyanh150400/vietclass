import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  School,
  Users,
  Wallet,
} from "lucide-react";
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

/** One capability that has shipped and can be opened from here. */
type ShippedFeature = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

/**
 * What Học vụ ships today, in the order the data depends on: a class needs a
 * subject and a teacher before it can exist, and a student before it has a roster.
 */
const SHIPPED_FEATURES: ShippedFeature[] = [
  {
    label: "Môn học",
    description: "Danh mục môn học dùng để mở lớp.",
    href: "/dashboard/academic/subjects",
    icon: BookOpen,
  },
  {
    label: "Giáo viên",
    description: "Hồ sơ giáo viên và tài khoản đăng nhập.",
    href: "/dashboard/academic/teachers",
    icon: GraduationCap,
  },
  {
    label: "Lớp học",
    description: "Lớp học, sĩ số và danh sách học sinh trong lớp.",
    href: "/dashboard/academic/classes",
    icon: School,
  },
  {
    label: "Học sinh",
    description: "Hồ sơ học sinh, phụ huynh và trạng thái học tập.",
    href: "/dashboard/academic/students",
    icon: Users,
  },
];

/**
 * Features named openly rather than left implicit, so a visitor can see where
 * the product is headed instead of finding a dead end. Order is unordered —
 * none of these has priority over the others — so the grid carries no
 * numbering.
 */
const ROADMAP_FEATURES: RoadmapFeature[] = [
  {
    label: "Lịch học",
    description: "Xếp lịch cố định theo thứ và xử lý buổi học thay đổi.",
    icon: CalendarDays,
  },
  {
    label: "Điểm danh",
    description: "Điểm danh từng buổi học và xem lại lịch sử.",
    icon: ClipboardCheck,
  },
  {
    label: "Học phí",
    description: "Tính học phí theo tháng và ghi nhận thanh toán.",
    icon: Wallet,
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
          Bắt đầu từ dữ liệu học vụ bên dưới. Các tính năng còn lại sẽ lần lượt
          ra mắt.
        </p>
      </div>

      <div className="grid gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Học vụ
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SHIPPED_FEATURES.map((feature) => (
            <ShippedCard key={feature.label} {...feature} />
          ))}
        </div>
      </div>

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

/**
 * Renders one shipped capability as a card that opens it. Solid rather than
 * dashed, so a working destination never looks like the drafts beside it.
 */
function ShippedCard({ label, description, href, icon: Icon }: ShippedFeature) {
  return (
    <Card className="relative gap-3 py-5 transition-colors hover:border-primary/60">
      <CardHeader className="gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <CardTitle className="text-sm">
          {/* The whole card is the target, so the row stays one click and the
              link text still names the destination on its own. */}
          <Link href={href} className="after:absolute after:inset-0">
            {label}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          {description}
          <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
