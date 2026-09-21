"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/shared/data-table/empty-state";
import { useCurrentUser } from "@/modules/auth";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { StudentDetailView, type StudentDetailTab } from "../components/student-detail-view";
import { useChangeStudentPassword, useSetStudentAccountActive, useStudent } from "../hooks/use-students";

/** Loads one student and coordinates capability-safe detail actions. */
export function StudentDetailContainer({ studentId }: { studentId: number }) {
  const query = useStudent(studentId);
  const currentUser = useCurrentUser(true);

  const canUpdate =
    currentUser.isSuccess && currentUser.data.features.includes("student.update");
  const canToggleAccount =
    currentUser.isSuccess && currentUser.data.features.includes("student.toggle_active");

  if (query.data !== undefined) {
    return (
      <LoadedStudentDetail
        student={query.data}
        canUpdate={canUpdate}
        canToggleAccount={canToggleAccount}
      />
    );
  }

  if (query.isPending) {
    return <StudentDetailSkeleton />;
  }

  return <StudentDetailError error={query.error} onRetry={() => void query.refetch()} />;
}

/** Reserves the detail layout while the student record is loading. */
function StudentDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải hồ sơ học sinh" className="grid min-w-0 gap-5">
      <Skeleton className="h-4 w-56" />
      <div className="grid min-w-0 gap-5 rounded-panel border border-vc-rule bg-background p-4 shadow-vc-sheet sm:p-6 min-[1181px]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Skeleton className="size-[68px] rounded-full md:size-24" />
        <div className="grid min-w-0 content-center gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <div className="grid gap-3 min-[1181px]:min-w-[330px]">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-14 w-32" />
            <Skeleton className="h-14 w-36" />
          </div>
          <div className="flex gap-2 min-[768px]:justify-end">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="size-11" />
          </div>
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid min-w-0 gap-3 min-[1181px]:grid-cols-[minmax(0,1.16fr)_minmax(300px,.84fr)]">
        <div className="grid min-w-0 gap-3">
          <Skeleton className="h-[330px] w-full rounded-panel" />
          <Skeleton className="h-[250px] w-full rounded-panel" />
        </div>
        <Skeleton className="h-[250px] w-full rounded-panel" />
      </div>
    </div>
  );
}

/** Classifies failures so access and missing-record messages never expose API detail. */
function studentDetailFailureKind(error: unknown): "missing" | "forbidden" | "error" {
  if (isApiClientError(error) && error.status === 404) return "missing";
  if (isApiClientError(error) && error.status === 403) return "forbidden";
  return "error";
}

/** Renders the detail-specific missing, forbidden, and retryable failure surfaces. */
function StudentDetailError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const kind = studentDetailFailureKind(error);
  const recoverable = kind === "error";

  return (
    <div className="student-detail-error min-h-[50svh]">
      <EmptyState
        image="/images/empty_2.png"
        title={
          kind === "missing"
            ? "Không tìm thấy học sinh."
            : kind === "forbidden"
              ? "Không có quyền truy cập hồ sơ học sinh"
              : "Không tải được hồ sơ học sinh"
        }
        description={
          kind === "missing"
            ? "Hồ sơ có thể đã bị xóa hoặc đường dẫn không còn hợp lệ."
            : kind === "forbidden"
              ? "Bạn không có quyền xem hồ sơ học sinh này."
              : "Dữ liệu hồ sơ chưa thay đổi. Vui lòng thử lại sau."
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            {recoverable ? (
              <Button type="button" onClick={onRetry}>
                Tải lại hồ sơ
              </Button>
            ) : null}
            <Button asChild variant={recoverable ? "link" : "default"}>
              <Link href="/academic/students">Quay lại danh sách học sinh</Link>
            </Button>
          </div>
        }
        className="mx-auto max-w-xl py-12"
      />
    </div>
  );
}

/** Owns URL tab state, account dialogs, mutations, and success/error feedback. */
function LoadedStudentDetail({
  student,
  canUpdate,
  canToggleAccount,
}: {
  student: NonNullable<ReturnType<typeof useStudent>["data"]>;
  canUpdate: boolean;
  canToggleAccount: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toggleAccount = useSetStudentAccountActive();
  const changePassword = useChangeStudentPassword();
  const showToast = useToast();

  const [confirmingAccount, setConfirmingAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const requestedTab = searchParams.get("tab");
  const activeTab: StudentDetailTab =
    requestedTab === "classes" || requestedTab === "rewards" || requestedTab === "reports"
      ? requestedTab
      : "profile";
  const hasAccount = typeof student.user_id === "number" && student.user_id > 0;
  const accountIsActive = student.is_account_active !== false;

  /** Replaces only the tab query while preserving other URL state and scroll position. */
  function setDetailTab(nextTab: StudentDetailTab): void {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  /** Applies the requested account state after confirmation and reports the result. */
  async function confirmAccountState(): Promise<void> {
    setAccountError(null);

    try {
      await toggleAccount.mutateAsync({ id: student.id, isActive: !accountIsActive });
      setConfirmingAccount(false);
      showToast({
        variant: "success",
        title: accountIsActive
          ? `Đã khóa tài khoản của ${student.full_name}.`
          : `Đã mở lại tài khoản của ${student.full_name}.`,
      });
    } catch (error) {
      setAccountError(isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.");
    }
  }

  return (
    <>
      <StudentDetailView
        student={student}
        activeTab={activeTab}
        onTabChange={setDetailTab}
        canUpdate={canUpdate}
        canToggleAccount={hasAccount && canToggleAccount}
        onToggleAccount={() => {
          if (!hasAccount || !canToggleAccount) return;
          setAccountError(null);
          setConfirmingAccount(true);
        }}
        onChangePassword={() => {
          if (!hasAccount || !canUpdate) return;
          setChangingPassword(true);
        }}
      />

      {hasAccount && canToggleAccount ? (
        <ConfirmActionDialog
          open={confirmingAccount}
          onOpenChange={(open) => (open ? undefined : setConfirmingAccount(false))}
          title={accountIsActive ? "Khóa tài khoản học sinh?" : "Mở lại tài khoản học sinh?"}
          description={
            accountIsActive
              ? `${student.full_name} sẽ không đăng nhập được nữa; hồ sơ, người giám hộ và các lớp vẫn được giữ nguyên.`
              : `${student.full_name} sẽ đăng nhập lại được bằng mật khẩu hiện tại; hồ sơ, người giám hộ và các lớp vẫn được giữ nguyên.`
          }
          confirmLabel={accountIsActive ? "Khóa" : "Mở"}
          destructive={accountIsActive}
          errorMessage={accountError}
          isPending={toggleAccount.isPending}
          onConfirm={() => void confirmAccountState()}
        />
      ) : null}

      {hasAccount && canUpdate && changingPassword ? (
        <ChangePasswordDialog
          open
          onOpenChange={(open) => (open ? undefined : setChangingPassword(false))}
          subjectName={student.full_name}
          submit={(password) => changePassword.mutateAsync({ id: student.id, password })}
        />
      ) : null}
    </>
  );
}
