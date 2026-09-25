"use client";

import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/data-table/empty-state";
import { InlineBadge } from "@/components/shared/inline-badge";
import { AppButton } from "@/components/shared/app-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/index";

import type { Student, StudentClass } from "../types/academic";
import type { PageMeta } from "@/lib/api/contracts";
import { StudentClassesList } from "./student-class-history-view";
import {
  GENDER_LABELS,
  GRADE_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  STUDENT_STATUS_LABELS,
  formatDate,
} from "../utils/labels";
import { UserAvatar } from "./user-avatar";

/** The URL-addressable panels on the student detail screen. */
export type StudentDetailTab = "profile" | "classes" | "rewards" | "reports";

/** Props for the stateless student detail presentation. */
export type StudentDetailViewProps = {
  student: Student;
  activeTab: StudentDetailTab;
  onTabChange: (tab: StudentDetailTab) => void;
  canUpdate: boolean;
  canToggleAccount: boolean;
  onChangePassword: () => void;
  onToggleAccount: () => void;
  canViewHistory: boolean;
  studentClasses: StudentClass[];
  studentClassesMeta: PageMeta | null;
  studentClassesLoading: boolean;
  studentClassesError: boolean;
  classPage: number;
  onClassPageChange: (page: number) => void;
  onRetryStudentClasses: () => void;
  onOpenClassHistory: (schoolClass: StudentClass, trigger: HTMLButtonElement) => void;
};

/** Masks a phone number while keeping enough trailing digits for recognition. */
function maskPhone(phone: string | null): string {
  if (phone === null || phone.trim() === "") return "Chưa cập nhật";

  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `••••••${digits.slice(-4)}` : "••••";
}

/** Renders the approved student profile hero, tabs, facts, guardians, and classes. */
export function StudentDetailView({
  student,
  activeTab,
  onTabChange,
  canUpdate,
  canToggleAccount,
  onChangePassword,
  onToggleAccount,
  canViewHistory,
  studentClasses,
  studentClassesMeta,
  studentClassesLoading,
  studentClassesError,
  classPage,
  onClassPageChange,
  onRetryStudentClasses,
  onOpenClassHistory,
}: StudentDetailViewProps) {
  const hasAccount = typeof student.user_id === "number" && student.user_id > 0;
  const accountIsActive = student.is_account_active !== false;
  const hasAccountActions = hasAccount && (canUpdate || canToggleAccount);

  return (
    <div className="grid min-w-0 gap-5">
      <Link
        href="/academic/students"
        className="inline-flex w-fit items-center text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowRight aria-hidden="true" className="mr-1 size-3.5 rotate-180" />
        Quay lại danh sách học sinh
      </Link>

      <section className="grid min-w-0 gap-5 rounded-panel border border-vc-rule bg-background p-4 shadow-vc-sheet sm:p-6 min-[1181px]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <UserAvatar
          value={student.avatar}
          name={student.full_name}
          alt={`Ảnh đại diện của ${student.full_name}`}
          className="size-[68px] border border-vc-control bg-card md:size-24"
        />

        <div className="min-w-0">
          <span className="text-[10px] font-semibold tracking-[0.09em] text-muted-foreground uppercase">
            Hồ sơ học sinh
          </span>
          <h2 className="mt-1 [overflow-wrap:anywhere] text-[26px] leading-tight font-semibold tracking-[-0.02em] sm:text-[34px]">
            {student.full_name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-mono">Mã học sinh {student.profile_id || student.id}</span>
            <span>{GRADE_LEVEL_LABELS[student.grade_level]}</span>
            <span>{student.active_enrollments.length} lớp đang học</span>
          </div>
        </div>

        <div className="grid gap-3 min-[1181px]:min-w-[330px] min-[1181px]:justify-items-end">
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <StatusBlock label="Trạng thái học" value={STUDENT_STATUS_LABELS[student.status]} active={student.status === 0} />
            <StatusBlock
              label="Trạng thái tài khoản"
              value={hasAccount ? (accountIsActive ? "Đang mở" : "Đã khóa") : "Chưa có tài khoản"}
              active={hasAccount && accountIsActive}
              muted={!hasAccount}
            />
          </div>

          <div className="flex flex-wrap justify-start gap-2 max-[767px]:grid max-[767px]:grid-cols-2 min-[1181px]:justify-end">
            {canUpdate ? (
              <AppButton
                href={`/academic/students/${student.id}/edit`}
                className="max-[767px]:col-span-2 max-[767px]:w-full"
              >
                <Pencil aria-hidden="true" className="size-[17px]" />
                Sửa hồ sơ
              </AppButton>
            ) : null}
            {hasAccountActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <AppButton
                    variant="outline"
                    size="icon"
                    className="size-11 rounded-control border-vc-control max-[767px]:justify-self-start"
                    aria-label="Tác vụ tài khoản khác"
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </AppButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canUpdate ? (
                    <DropdownMenuItem onSelect={onChangePassword}>
                      <KeyRound aria-hidden="true" className="size-4" />
                      Đổi mật khẩu
                    </DropdownMenuItem>
                  ) : null}
                  {canToggleAccount ? (
                    <DropdownMenuItem onSelect={onToggleAccount}>
                      {accountIsActive ? (
                        <Lock aria-hidden="true" className="size-4" />
                      ) : (
                        <LockOpen aria-hidden="true" className="size-4" />
                      )}
                      {accountIsActive ? "Khóa tài khoản" : "Mở tài khoản"}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as StudentDetailTab)}
        className="min-w-0 gap-3"
      >
        <div className="min-w-0 overflow-x-auto pb-1">
          <TabsList
            variant="segmented"
            aria-label="Nội dung hồ sơ học sinh"
            className="min-w-[560px] grid-cols-4 bg-vc-tint shadow-[0_2px_0_var(--vc-shell-rule)]"
          >
            <TabsTrigger value="profile" className="rounded-[4px] px-2 text-[11px] font-semibold sm:text-xs">
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger
              value="classes"
              className="gap-1 rounded-[4px] px-2 text-[11px] font-semibold sm:gap-1.5 sm:text-xs"
            >
              Lớp học
              <Count
                value={canViewHistory
                  ? (studentClassesMeta?.total ?? student.active_enrollments.length)
                  : student.active_enrollments.length}
              />
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1 rounded-[4px] px-2 text-[11px] font-semibold sm:gap-1.5 sm:text-xs">
              Điểm thưởng
              <SoonBadge />
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 rounded-[4px] px-2 text-[11px] font-semibold sm:gap-1.5 sm:text-xs">
              Báo cáo học tập
              <SoonBadge />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-0 min-w-0 outline-none">
          <div className="grid min-w-0 gap-3 min-[1181px]:grid-cols-[minmax(0,1.16fr)_minmax(300px,.84fr)]">
            <div className="grid min-w-0 gap-3">
              <DetailCard title="Thông tin cá nhân" description="Thông tin hồ sơ dùng trong công tác học vụ.">
                <dl className="grid gap-x-6 min-[768px]:grid-cols-2">
                  <Fact label="Họ và tên" value={student.full_name} />
                  <Fact label="Mã học sinh" value={String(student.profile_id || student.id)} mono />
                  <Fact label="Ngày sinh" value={formatDate(student.dob)} />
                  <Fact label="Giới tính" value={GENDER_LABELS[student.gender]} />
                  <Fact label="Số điện thoại" value={maskPhone(student.phone)} mono masked={student.phone !== null && student.phone.trim() !== ""} />
                  <Fact label="Khối lớp" value={GRADE_LEVEL_LABELS[student.grade_level]} />
                  <Fact label="Địa chỉ" value={student.address ?? "Chưa cập nhật"} wide />
                  <Fact label="Ghi chú" value={student.note ?? "Chưa có ghi chú"} wide />
                </dl>
              </DetailCard>
              <GuardiansCard student={student} />
            </div>

            <DetailCard title="Tài khoản" description="Quyền đăng nhập không gian học tập.">
              <div className="grid gap-4">
                <div className="grid min-w-0 gap-1.5 rounded-control border border-vc-rule bg-background p-3.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">Tên đăng nhập</span>
                  <strong className="[overflow-wrap:anywhere] font-mono text-sm">
                    {hasAccount ? student.username ?? "Chưa cấp tên đăng nhập" : "Chưa cấp tài khoản"}
                  </strong>
                </div>
                <p className="text-xs leading-[1.65] text-muted-foreground">
                  {hasAccount
                    ? accountIsActive
                      ? "Tài khoản có thể đăng nhập bình thường. Mật khẩu hiện tại không được hiển thị để bảo vệ tài khoản."
                      : "Tài khoản đang bị khóa và không thể đăng nhập. Hồ sơ, người giám hộ và các lớp vẫn được giữ nguyên."
                    : "Hồ sơ này chưa có tài khoản đăng nhập."}
                </p>
              </div>
            </DetailCard>
          </div>
        </TabsContent>

        <TabsContent value="classes" className="mt-0 min-w-0 outline-none">
          <DetailCard
            title="Lớp học"
            description={
              canViewHistory
                ? studentClassesMeta === null
                  ? "Các lớp đang học và đã từng học, mỗi lớp hiển thị một lần."
                  : `${student.active_enrollments.length} lớp đang học · ${Math.max(0, studentClassesMeta.total - student.active_enrollments.length)} lớp đã rời. Mỗi lớp hiển thị một lần.`
                : "Các lớp còn hiệu lực theo ghi danh hiện tại."
            }
            action={
              canViewHistory ? (
                <InlineBadge type="muted" className="font-sans text-[10px] font-semibold">
                  Lịch sử: chỉ quản trị viên
                </InlineBadge>
              ) : (
                <Count value={student.active_enrollments.length} label="lớp" />
              )
            }
          >
            {canViewHistory ? (
              <StudentClassesList
                classes={studentClasses}
                meta={studentClassesMeta}
                isLoading={studentClassesLoading}
                isError={studentClassesError}
                page={classPage}
                onPageChange={onClassPageChange}
                onRetry={onRetryStudentClasses}
                onOpenHistory={onOpenClassHistory}
              />
            ) : student.active_enrollments.length === 0 ? (
              <ClassesEmptyState />
            ) : (
              <ActiveClasses student={student} />
            )}
          </DetailCard>
        </TabsContent>

        <TabsContent value="rewards" className="mt-0 outline-none">
          <UpcomingPanel title="Điểm thưởng" description="Module điểm thưởng chưa được triển khai." />
        </TabsContent>
        <TabsContent value="reports" className="mt-0 outline-none">
          <UpcomingPanel title="Báo cáo học tập" description="Module báo cáo học tập chưa được triển khai." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Renders one compact status block while keeping study and account state separate. */
function StatusBlock({ label, value, active, muted = false }: { label: string; value: string; active: boolean; muted?: boolean }) {
  return (
    <div className="grid gap-1 rounded-control border border-vc-rule bg-card px-3 py-2">
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", muted && "text-muted-foreground")}>
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-vc-leaf" : "bg-muted-foreground/60")} />
        {value}
      </span>
    </div>
  );
}

/** Renders a count token shared by tabs and card headers. */
function Count({ value, label }: { value: number; label?: string }) {
  return (
    <InlineBadge
      type="neutral"
      className="w-fit min-h-0 gap-1 rounded-[3px] border-current bg-transparent px-1.5 py-0 font-sans text-[10px] leading-none text-current"
    >
      {value}{label ? ` ${label}` : ""}
    </InlineBadge>
  );
}

/** Marks modules that are visible in the information architecture but not shipped. */
function SoonBadge() {
  return <InlineBadge type="neutral" className="min-h-0 gap-1 rounded-[3px] px-1.5 py-0.5 font-sans text-[9px] font-semibold">Sắp có</InlineBadge>;
}

/** Renders one labelled profile fact in the approved two-column grid. */
function Fact({ label, value, mono = false, masked = false, wide = false }: { label: string; value: string; mono?: boolean; masked?: boolean; wide?: boolean }) {
  return (
    <div className={cn("min-w-0 border-b border-vc-rule py-3 last:border-b-0 min-[768px]:[&:nth-last-child(-n+2)]:border-b-0", wide && "min-[768px]:col-span-2")}>
      <dt className="mb-1 text-[11px] font-semibold text-muted-foreground">{label}</dt>
      <dd className={cn("flex min-w-0 flex-wrap items-center gap-1.5 [overflow-wrap:anywhere] text-[13px] font-semibold", mono && "font-mono text-xs")}>
        {value}
        {masked ? (
          <InlineBadge
            type="muted"
            className="min-h-0 rounded-[3px] px-1 py-0.5 font-sans text-[9px] font-semibold"
          >
            Đã che
          </InlineBadge>
        ) : null}
      </dd>
    </div>
  );
}

/** Renders a bordered card frame used across the detail tabs. */
function DetailCard({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-panel border border-vc-rule bg-card shadow-vc-sheet">
      <header className="flex min-w-0 items-start justify-between gap-4 border-b border-vc-rule px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Renders every guardian with the primary contact first and masked phone data. */
function GuardiansCard({ student }: { student: Student }) {
  const guardians = [...student.guardians].sort((left, right) => Number(right.is_primary) - Number(left.is_primary));

  return (
    <DetailCard title="Người giám hộ" description={`${guardians.length} người`} action={<Count value={guardians.length} label="người" />}>
      {guardians.length === 0 ? (
        <p className="py-5 text-center text-xs text-muted-foreground">Chưa có người giám hộ trong hồ sơ.</p>
      ) : (
        <div className="grid gap-2">
          {guardians.map((guardian) => (
            <div key={guardian.profile_id} className="grid min-w-0 gap-2 rounded-control border border-vc-rule bg-background p-3 min-[391px]:grid-cols-[minmax(0,1fr)_minmax(150px,auto)] min-[391px]:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <strong className="[overflow-wrap:anywhere] text-sm">{guardian.full_name}</strong>
                  {guardian.is_primary ? (
                    <InlineBadge
                      type="neutral"
                      className="min-h-0 rounded-[3px] border-vc-orange/30 bg-vc-orange/10 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-vc-orange-deep"
                    >
                      Liên hệ chính
                    </InlineBadge>
                  ) : null}
                </div>
                <span className="mt-1 block text-[11px] text-muted-foreground">{GUARDIAN_RELATIONSHIP_LABELS[guardian.relationship]}</span>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                {maskPhone(guardian.phone)}
                {guardian.phone !== null && guardian.phone.trim() !== "" ? (
                  <InlineBadge
                    type="muted"
                    className="min-h-0 rounded-[3px] px-1 py-0.5 font-sans text-[9px] font-semibold"
                  >
                    Đã che
                  </InlineBadge>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 border-t border-vc-rule pt-3 text-[11px] leading-[1.6] text-muted-foreground">Thêm, sửa hoặc xóa người giám hộ qua Sửa hồ sơ.</p>
    </DetailCard>
  );
}

/** Renders only the active enrollment summaries as quiet class links. */
function ActiveClasses({ student }: { student: Student }) {
  return (
    <div className="grid gap-2">
      {student.active_enrollments.map((schoolClass) => (
        <Link
          key={schoolClass.class_id}
          href={`/academic/classes/${schoolClass.class_id}`}
          className="grid min-w-0 gap-2 rounded-control border border-vc-rule bg-background p-3 transition-[border-color,box-shadow] hover:border-vc-control hover:shadow-[0_2px_0_var(--vc-shell-rule)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none min-[391px]:grid-cols-2 min-[391px]:items-center min-[861px]:grid-cols-[minmax(0,1fr)_minmax(120px,auto)_minmax(130px,auto)_auto]"
        >
          <strong className="min-w-0 [overflow-wrap:anywhere] text-sm">{schoolClass.name}</strong>
          <span className="font-mono text-[11px] text-muted-foreground">{schoolClass.code}</span>
          <span className="min-w-0 [overflow-wrap:anywhere] text-[11px] text-muted-foreground">{schoolClass.subject_name ?? "Môn học chưa cập nhật"}</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-vc-orange-deep">
            Xem lớp
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Explains the no-active-class state and links to the class directory. */
function ClassesEmptyState() {
  return (
    <EmptyState
      image="/images/empty_1.png"
      title="Chưa có lớp đang học"
      description="Ghi danh còn hiệu lực được quản lý từ chi tiết lớp học."
      action={
        <Button asChild variant="link" size="sm">
          <Link href="/academic/classes">Mở danh sách lớp</Link>
        </Button>
      }
      className="py-8"
    />
  );
}

/** Keeps future modules honest by showing availability without invented metrics. */
function UpcomingPanel({ title, description }: { title: string; description: string }) {
  return (
    <section className="grid min-h-56 place-items-center rounded-panel border border-dashed border-vc-rule bg-card p-6 text-center shadow-vc-sheet">
      <div className="grid justify-items-center gap-3">
        <SoonBadge />
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-[46ch] text-sm leading-[1.6] text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
