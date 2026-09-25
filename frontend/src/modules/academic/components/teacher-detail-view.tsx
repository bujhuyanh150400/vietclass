"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, Lock, LockOpen, Pencil, School } from "lucide-react";
import type { ReactNode } from "react";

import { InlineBadge } from "@/components/shared/inline-badge";
import { AppButton } from "@/components/shared/app-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/index";

import type { Teacher, TeacherClass } from "../types/academic";
import { CLASS_STATUS_LABELS, TEACHER_STATUS_LABELS, formatDate } from "../utils/labels";
import { UserAvatar } from "./user-avatar";

/** The two reader-facing panels on the teacher detail screen. */
export type TeacherDetailTab = "profile" | "classes";

/** Renders the approved teacher profile hero, tabs, facts, account, and classes. */
export function TeacherDetailView({
  teacher,
  activeTab,
  onTabChange,
  onToggleAccount,
  onChangePassword,
}: {
  teacher: Teacher;
  activeTab: TeacherDetailTab;
  onTabChange: (tab: TeacherDetailTab) => void;
  onToggleAccount: () => void;
  onChangePassword: () => void;
}) {
  const hasAccount = typeof teacher.user_id === "number" && teacher.user_id > 0;
  const accountIsActive = teacher.is_account_active !== false;
  const assignedClasses = teacher.classes.length + teacher.assistant_classes.length;
  const endedClasses = teacher.ended_classes ?? [];
  const endedAssistantClasses = teacher.ended_assistant_classes ?? [];
  const hasEndedClasses = endedClasses.length + endedAssistantClasses.length > 0;

  return (
    <div className="grid gap-5">
      <section className="grid items-center gap-4 rounded-panel border border-vc-rule bg-background p-4 shadow-vc-sheet sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <UserAvatar
          value={teacher.avatar}
          name={teacher.full_name}
          alt={`Ảnh đại diện của ${teacher.full_name}`}
          className="size-[72px] border border-vc-control bg-card sm:size-28"
        />

        <div className="min-w-0">
          <span className="text-[10px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
            Hồ sơ giáo viên
          </span>
          <h2 className="mt-1 text-[26px] leading-tight font-semibold tracking-[-0.02em] sm:text-[34px]">
            {teacher.full_name}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Mã hồ sơ #{teacher.id}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Trạng thái hồ sơ">
            <InlineBadge
              type={teacher.status === 0 ? "success" : "muted"}
              className="font-sans text-[11px] font-bold whitespace-nowrap"
            >
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {TEACHER_STATUS_LABELS[teacher.status]}
            </InlineBadge>
            {hasAccount ? (
              <StatusBadge
                status={accountIsActive ? "active" : "inactive"}
                label={accountIsActive ? "Đang mở" : "Đã khóa"}
              />
            ) : (
              <InlineBadge
                type="muted"
                className="border-dashed font-sans text-[11px] font-semibold"
              >
                Chưa có tài khoản
              </InlineBadge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
          <AppButton href={`/academic/teachers/${teacher.id}/edit`} className="w-auto max-sm:w-full">
            <Pencil aria-hidden="true" className="size-[17px]" />
            Sửa hồ sơ
          </AppButton>
          {hasAccount ? (
            <Button
              type="button"
              variant={accountIsActive ? "destructive" : "outline"}
              className="h-11 gap-2 rounded-control max-sm:w-full"
              onClick={onToggleAccount}
            >
              {accountIsActive ? (
                <Lock aria-hidden="true" className="size-[17px]" />
              ) : (
                <LockOpen aria-hidden="true" className="size-[17px]" />
              )}
              {accountIsActive ? "Khóa tài khoản" : "Mở tài khoản"}
            </Button>
          ) : null}
          <Button
            asChild
            variant="outline"
            className="h-11 gap-2 rounded-control max-sm:w-full"
          >
            <Link href="/academic/teachers">
              <ArrowLeft aria-hidden="true" className="size-[17px]" />
              Quay lại
            </Link>
          </Button>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as TeacherDetailTab)}
        className="min-w-0 gap-3"
      >
        <TabsList
          variant="segmented"
          aria-label="Nội dung hồ sơ giáo viên"
          className="min-w-0 max-w-[460px] grid-cols-2 bg-vc-tint p-1 shadow-[0_2px_0_var(--vc-shell-rule)]"
        >
          <TabsTrigger
            value="profile"
            className="min-w-0 rounded-[4px] px-2 text-[11px] leading-tight font-semibold text-center text-muted-foreground sm:px-3 sm:text-xs data-[state=active]:border-vc-ink data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper"
          >
            <span className="min-w-0">Hồ sơ giáo viên</span>
          </TabsTrigger>
          <TabsTrigger
            value="classes"
            className="min-w-0 gap-1 rounded-[4px] px-2 text-[11px] leading-tight font-semibold text-center text-muted-foreground sm:gap-1.5 sm:px-3 sm:text-xs data-[state=active]:border-vc-ink data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper"
          >
            <span className="min-w-0">Lớp phân công</span>
            <InlineBadge
              type="neutral"
              className="min-h-0 shrink-0 gap-1 rounded-[3px] border-current bg-transparent px-1.5 py-0 font-sans text-[10px] leading-none text-current"
            >
              {assignedClasses}
            </InlineBadge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 outline-none">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.16fr)_minmax(300px,.84fr)]">
            <DetailCard
              title="Thông tin giáo viên"
              description="Thông tin hồ sơ dùng trong công tác học vụ."
            >
              <dl className="grid gap-x-6 sm:grid-cols-2">
                {[
                  { label: "Họ và tên", value: teacher.full_name },
                  { label: "Mã hồ sơ", value: `#${teacher.id}`, mono: true },
                  { label: "Số điện thoại", value: teacher.phone ?? "Chưa có số điện thoại", mono: true },
                  { label: "Email", value: teacher.email ?? "Chưa có email" },
                  { label: "Ngày vào làm", value: formatDate(teacher.joined_at) },
                  { label: "Địa chỉ", value: teacher.address ?? "Chưa cập nhật" },
                ].map((fact) => (
                  <div
                    key={fact.label}
                    className="min-w-0 border-b border-vc-rule py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                  >
                    <dt className="mb-1 text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                    <dd
                      className={cn(
                        "[overflow-wrap:anywhere] text-[13px] font-semibold",
                        fact.mono && "font-mono text-xs",
                      )}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </DetailCard>

            <DetailCard
              title="Tài khoản đăng nhập"
              description="Quyền truy cập không gian làm việc."
              action={
                hasAccount ? (
                  <StatusBadge
                    status={accountIsActive ? "active" : "inactive"}
                    label={accountIsActive ? "Đang mở" : "Đã khóa"}
                  />
                ) : undefined
              }
            >
              <div className="grid gap-4">
                <div className="grid gap-1.5 rounded-control border border-vc-rule bg-background p-3.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">Tên đăng nhập</span>
                  <strong className="font-mono text-sm">
                    {teacher.username ?? "Chưa cấp tài khoản"}
                  </strong>
                </div>
                <p className="text-xs leading-[1.65] text-muted-foreground">
                  {hasAccount
                    ? accountIsActive
                      ? "Tài khoản có thể đăng nhập bình thường. Mật khẩu hiện tại không được hiển thị để bảo vệ tài khoản."
                      : "Tài khoản đang bị khóa và không thể đăng nhập. Hồ sơ giáo viên cùng các phân công lớp vẫn được giữ nguyên."
                    : "Hồ sơ này chưa có tài khoản đăng nhập."}
                </p>
                {hasAccount ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-fit gap-2 rounded-control border-vc-control max-sm:w-full"
                    onClick={onChangePassword}
                  >
                    <KeyRound aria-hidden="true" className="size-[17px]" />
                    Đổi mật khẩu
                  </Button>
                ) : null}
              </div>
            </DetailCard>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-0 outline-none">
          <DetailCard
            title="Lớp phân công"
            description="Vai trò trong từng lớp và trạng thái lớp. Thay đổi phân công trong biểu mẫu sửa lớp."
            action={
              <InlineBadge type="neutral" className="font-sans text-[11px] font-semibold">
                {assignedClasses} lớp đang hoạt động
              </InlineBadge>
            }
          >
            {assignedClasses === 0 && !hasEndedClasses ? <ClassesEmptyState /> : (
              <div className="grid gap-6">
                <section className="grid gap-2.5" aria-label="Lớp phụ trách chính">
                  <div>
                    <h4 className="text-sm font-semibold">Phụ trách chính · {teacher.classes.length}</h4>
                    <p className="text-xs text-muted-foreground">Giáo viên chịu trách nhiệm chính của lớp.</p>
                  </div>
                  {teacher.classes.length === 0 ? (
                    <p className="rounded-control border border-dashed border-vc-rule p-3 text-xs text-muted-foreground">Không phụ trách chính lớp nào.</p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {teacher.classes.map((schoolClass) => (
                        <TeacherClassCard key={schoolClass.id} schoolClass={schoolClass} role="Phụ trách" />
                      ))}
                    </div>
                  )}
                </section>
                <section className="grid gap-2.5 border-t border-vc-rule pt-5" aria-label="Lớp trợ giảng">
                  <div>
                    <h4 className="text-sm font-semibold">Trợ giảng · {teacher.assistant_classes.length}</h4>
                    <p className="text-xs text-muted-foreground">Hỗ trợ giáo viên phụ trách của lớp.</p>
                  </div>
                  {teacher.assistant_classes.length === 0 ? (
                    <p className="rounded-control border border-dashed border-vc-rule p-3 text-xs text-muted-foreground">Không làm trợ giảng ở lớp nào.</p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {teacher.assistant_classes.map((schoolClass) => (
                        <TeacherClassCard key={schoolClass.id} schoolClass={schoolClass} role="Trợ giảng" />
                      ))}
                    </div>
                  )}
                </section>
                {hasEndedClasses ? (
                  <section className="grid gap-2.5 border-t border-vc-rule pt-5" aria-label="Lớp đã kết thúc">
                    <div>
                      <h4 className="text-sm font-semibold">Lớp đã kết thúc · {endedClasses.length + endedAssistantClasses.length}</h4>
                      <p className="text-xs text-muted-foreground">Giữ nguyên như dữ liệu lịch sử.</p>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {endedClasses.map((schoolClass) => (
                        <TeacherClassCard key={`lead-${schoolClass.id}`} schoolClass={schoolClass} role="Phụ trách" />
                      ))}
                      {endedAssistantClasses.map((schoolClass) => (
                        <TeacherClassCard key={`assistant-${schoolClass.id}`} schoolClass={schoolClass} role="Trợ giảng" />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </DetailCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Renders the shared bordered card frame used by both detail panels. */
function DetailCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-panel border border-vc-rule bg-card shadow-vc-sheet">
      <header className="flex items-start justify-between gap-4 border-b border-vc-rule px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Renders one assigned class as a link to its existing class detail screen. */
function TeacherClassCard({ schoolClass, role }: { schoolClass: TeacherClass; role: "Phụ trách" | "Trợ giảng" }) {
  return (
    <Link
      href={`/academic/classes/${schoolClass.id}`}
      className="group grid min-w-0 gap-3 rounded-panel border border-vc-rule bg-background p-3.5 transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-vc-control hover:shadow-[0_3px_0_var(--vc-shell-rule)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="truncate text-sm font-semibold">{schoolClass.name}</h5>
          <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{schoolClass.code}</span>
        </div>
        <span className="grid size-7 shrink-0 place-items-center rounded-control border border-vc-rule bg-card">
          <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
        <School aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{schoolClass.subject_name ?? "Môn học chưa cập nhật"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <InlineBadge type="neutral" className="font-sans text-[10px] font-semibold">
          {role}
        </InlineBadge>
        <InlineBadge
          type={schoolClass.status === 0 ? "success" : "muted"}
          className="font-sans text-[10px] font-semibold"
        >
          {CLASS_STATUS_LABELS[schoolClass.status]}
        </InlineBadge>
      </div>
      <span className="sr-only">Mở chi tiết lớp</span>
    </Link>
  );
}

/** Explains the no-assignment state without offering a dead-end action. */
function ClassesEmptyState() {
  return (
    <div className="grid min-h-36 place-items-center px-5 py-6 text-center">
      <div>
        <School aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
        <h4 className="mt-3 text-sm font-semibold">Chưa được phân công lớp nào</h4>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Khi có phân công, lớp đang dạy sẽ xuất hiện tại đây.
        </p>
      </div>
    </div>
  );
}
