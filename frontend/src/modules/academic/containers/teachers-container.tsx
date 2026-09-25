"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InfoDialog } from "@/components/shared/info-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { TeachersView } from "../components/teachers-view";
import { useClassOptions } from "../hooks/use-classes";
import { useSubjectOptions } from "../hooks/use-subjects";
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
  const router = useRouter();
  const list = useTeacherList();
  const subjectOptions = useSubjectOptions();
  const classOptions = useClassOptions();
  const toggleAccount = useSetTeacherAccountActive();
  const changePassword = useChangeTeacherPassword();
  const showToast = useToast();

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
      const wasActive = lockTarget.is_account_active !== false;

      await toggleAccount.mutateAsync({
        id: lockTarget.id,
        isActive: lockTarget.is_account_active === false,
      });

      showToast({
        variant: "success",
        title: wasActive
          ? `Đã khóa tài khoản của ${lockTarget.full_name}.`
          : `Đã mở lại tài khoản của ${lockTarget.full_name}.`,
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
        filters={list.filters}
        filterCount={list.filterCount}
        sort={list.sort}
        view={list.view}
        tablePageSize={list.tablePageSize}
        subjectOptions={subjectOptions.data ?? []}
        classOptions={classOptions.data ?? []}
        onSearchChange={list.query.setSearch}
        onSubjectChange={list.setSubject}
        onClassChange={list.setClass}
        onAccountActiveChange={list.setAccountActive}
        onJoinedFromChange={list.setJoinedFrom}
        onJoinedToChange={list.setJoinedTo}
        onClearFilters={list.clearFilters}
        onSortChange={list.setSort}
        onViewChange={list.setView}
        onTablePageSizeChange={list.setTablePageSize}
        onClearConditions={list.clearConditions}
        onPageChange={list.query.setPage}
        onViewTeacher={(teacher) => router.push(`/academic/teachers/${teacher.id}`)}
        onToggleAccount={(teacher) => {
          setActionError(null);
          setLockTarget(teacher);
        }}
        onChangePassword={setPasswordTarget}
      />

      <InfoDialog
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
