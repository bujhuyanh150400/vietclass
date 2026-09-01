"use client";

import { useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { StudentsView } from "../components/students-view";
import {
  useChangeStudentPassword,
  useSetStudentAccountActive,
  useStudentList,
} from "../hooks/use-students";
import type { Student } from "../types/academic";

/**
 * Coordinates the student list, the account lock confirmation, and the password
 * dialog.
 *
 * Locking an account is deliberately described as separate from whether the
 * student is still studying, because the two are separate fields and confusing
 * them would make someone think a locked account had also ended the enrolments.
 */
export function StudentsContainer() {
  const list = useStudentList();
  const toggleAccount = useSetStudentAccountActive();
  const changePassword = useChangeStudentPassword();

  const [lockTarget, setLockTarget] = useState<Student | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<Student | null>(null);
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
      <StudentsView
        state={list.state}
        meta={list.meta}
        search={list.query.q}
        onSearchChange={list.query.setSearch}
        onPageChange={list.query.setPage}
        onToggleAccount={(student) => {
          setActionError(null);
          setLockTarget(student);
        }}
        onChangePassword={setPasswordTarget}
      />

      <ConfirmActionDialog
        open={lockTarget !== null}
        onOpenChange={(open) => (open ? undefined : setLockTarget(null))}
        title={locking ? "Khóa tài khoản học sinh?" : "Mở lại tài khoản học sinh?"}
        description={
          lockTarget === null
            ? ""
            : locking
              ? `${lockTarget.full_name} sẽ không đăng nhập được nữa, và sẽ không thêm được vào lớp mới. Trạng thái học tập và các lớp đang học giữ nguyên.`
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
