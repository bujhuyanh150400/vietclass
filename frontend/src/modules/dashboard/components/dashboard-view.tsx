import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Renders the static dashboard landing content without introducing a container
 * for a page that currently has no business state to coordinate.
 */
export function DashboardView() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Chào mừng bạn đến với VietClasses.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Hệ thống đã sẵn sàng</CardTitle>
          <CardDescription>
            Bạn đã đăng nhập thành công. Các chức năng quản lý lớp học sẽ được bổ
            sung trong các phiên bản tiếp theo.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
