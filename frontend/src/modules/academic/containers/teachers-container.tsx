"use client";

import { useState } from "react";

import { isApiClientError } from "@/lib/api/api-client-error";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { ConfirmActionDialog } from "../components/confirm-action-dialog";
import { TeachersView } from "../components/teachers-view";
import {
  useChangeTeacherPassword,
  useSetTeacherAccountActive,
  useTeacherList,
} from "../hooks/use-teachers";
import type { Teacher } from "../types/academic";

/**
 * Coordinates the teacher list, the account lock confirmation, and the password
 * dialog.
 *
 * Locking an account is confirmed rather than applied straight from the menu,
 * because it takes someone's access away and the row alone does not say what will
 * still work afterwards.
 */
export function TeachersContainer() {
  const list = useTeacherList();
  const toggleAccount = useSetTeacherAccountActive();
  const changePassword = useChangeTeacherPassword();

  const [lockTarget, setLockTarget] = useState<Teacher | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<Teacher | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Applies the account change and closes only once the API accepts it. */
  async function confirmLock() {
    if (lockTarget === null) {
      return;
    }

    setActionError(null);

    try {
      await toggleAccount.mutateAsync({
        id: lockTarget.id,
        isActive: lockTarget.is_account_active === false,
      });
      setLockTarget(null);
    } catch (error) {
      setActionError(
        isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.",
      );
    }
  }

  const locking = lockTarget?.is_account_active !== false;

  return (
    <>
      <TeachersView
        state={list.state}
        meta={list.meta}
        search={list.query.q}
        onSearchChange={list.query.setSearch}
        onPageChange={list.query.setPage}
        onToggleAccount={(teacher) => {
          setActionError(null);
          setLockTarget(teacher);
        }}
        onChangePassword={setPasswordTarget}
      />

      <ConfirmActionDialog
        open={lockTarget !== null}
        onOpenChange={(open) => (open ? undefined : setLockTarget(null))}
        title={locking ? "Khóa tài khoản giáo viên?" : "Mở lại tài khoản giáo viên?"}
        description={
          lockTarget === null
            ? ""
            : locking
              ? `${lockTarget.full_name} sẽ không đăng nhập được nữa. Hồ sơ và các lớp đang phụ trách giữ nguyên.`
              : `${lockTarget.full_name} sẽ đăng nhập lại được bằng mật khẩu hiện tại.`
        }
        confirmLabel={locking ? "Khóa" : "Mở"}
        destructive={locking}
        errorMessage={actionError}
        isPending={toggleAccount.isPending}
        onConfirm={() => void confirmLock()}
      />

      {passwordTarget === null ? null : (
        <ChangePasswordDialog
          open
          onOpenChange={(open) => (open ? undefined : setPasswordTarget(null))}
          subjectName={passwordTarget.full_name}
          submit={(password) =>
            changePassword.mutateAsync({ id: passwordTarget.id, password })
          }
        />
      )}
    </>
  );
}
