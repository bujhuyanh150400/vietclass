"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ResourceLoader } from "@/components/shared/resource-loader";
import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { TeacherDetailView, type TeacherDetailTab } from "../components/teacher-detail-view";
import {
  useChangeTeacherPassword,
  useSetTeacherAccountActive,
  useTeacher,
} from "../hooks/use-teachers";

/** Loads one teacher and coordinates its detail tabs and account actions. */
export function TeacherDetailContainer({ teacherId }: { teacherId: number }) {
  const query = useTeacher(teacherId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy giáo viên.">
      {(teacher) => <LoadedTeacherDetail teacher={teacher} />}
    </ResourceLoader>
  );
}

/** Keeps URL tab state and irreversible account actions beside the detail view. */
function LoadedTeacherDetail({
  teacher,
}: {
  teacher: NonNullable<ReturnType<typeof useTeacher>["data"]>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toggleAccount = useSetTeacherAccountActive();
  const changePassword = useChangeTeacherPassword();
  const showToast = useToast();

  const [confirmingLock, setConfirmingLock] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const activeTab: TeacherDetailTab =
    searchParams.get("tab") === "classes" ? "classes" : "profile";
  const hasAccount = typeof teacher.user_id === "number" && teacher.user_id > 0;
  const accountIsActive = teacher.is_account_active !== false;

  /** Replaces only the detail tab query while preserving other URL state. */
  function setDetailTab(nextTab: TeacherDetailTab): void {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "classes") {
      params.set("tab", "classes");
    } else {
      params.delete("tab");
    }

    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  /** Applies the requested account state after the confirmation dialog accepts it. */
  async function confirmLock(): Promise<void> {
    setLockError(null);

    try {
      await toggleAccount.mutateAsync({ id: teacher.id, isActive: !accountIsActive });
      setConfirmingLock(false);
      showToast({
        variant: "success",
        title: accountIsActive
          ? `Đã khóa tài khoản của ${teacher.full_name}.`
          : `Đã mở lại tài khoản của ${teacher.full_name}.`,
      });
    } catch (error) {
      setLockError(isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.");
    }
  }

  if (!hasAccount) {
    return (
      <TeacherDetailView
        teacher={teacher}
        activeTab={activeTab}
        onTabChange={setDetailTab}
        onToggleAccount={() => undefined}
        onChangePassword={() => undefined}
      />
    );
  }

  return (
    <>
      <TeacherDetailView
        teacher={teacher}
        activeTab={activeTab}
        onTabChange={setDetailTab}
        onToggleAccount={() => {
          setLockError(null);
          setConfirmingLock(true);
        }}
        onChangePassword={() => setChangingPassword(true)}
      />

      <ConfirmActionDialog
        open={confirmingLock}
        onOpenChange={(open) => (open ? undefined : setConfirmingLock(false))}
        title={accountIsActive ? "Khóa tài khoản giáo viên?" : "Mở lại tài khoản giáo viên?"}
        description={
          accountIsActive
            ? `${teacher.full_name} sẽ không đăng nhập được nữa; hồ sơ và dữ liệu học vụ vẫn giữ nguyên.`
            : `${teacher.full_name} sẽ đăng nhập lại được bằng mật khẩu hiện tại.`
        }
        confirmLabel={accountIsActive ? "Khóa" : "Mở"}
        destructive={accountIsActive}
        errorMessage={lockError}
        isPending={toggleAccount.isPending}
        onConfirm={() => void confirmLock()}
      />

      {changingPassword ? (
        <ChangePasswordDialog
          open
          onOpenChange={(open) => (open ? undefined : setChangingPassword(false))}
          subjectName={teacher.full_name}
          submit={(password) => changePassword.mutateAsync({ id: teacher.id, password })}
        />
      ) : null}
    </>
  );
}
