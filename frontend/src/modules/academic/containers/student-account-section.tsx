"use client";

import { KeyRound, Lock, LockOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Field } from "@/components/shared/field";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiClientError } from "@/lib/api/api-client-error";
import { cn } from "@/lib/utils/index";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { SHEET_CONTROL, SHEET_FIELD_TYPE } from "../components/form-control";
import { useChangeStudentPassword, useSetStudentAccountActive } from "../hooks/use-students";
import type { Student } from "../types/academic";

/** One boxed account fact with the button that changes it. */
function AccountRow({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description: string;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-control border border-vc-control bg-card p-[13px_14px] max-sm:grid-cols-1",
        className,
      )}
    >
      <div className="min-w-0">
        <strong className="flex flex-wrap items-center gap-2 text-xs font-semibold">{title}</strong>
        <small className="mt-[3px] block text-[10px] leading-[1.5] text-muted-foreground">
          {description}
        </small>
      </div>
      {action}
    </div>
  );
}

/**
 * Presents the login account of a student who already exists.
 *
 * Nothing here is part of the profile form it sits inside. The login name cannot be
 * changed at all, and locking the account and replacing the password each have their
 * own endpoint — so they act the moment they are confirmed rather than waiting on
 * "Lưu thay đổi", and the block says so instead of leaving a reader to discover it.
 * That is also why the state is a badge and a button rather than a select: a control
 * that looks like a form field but writes immediately is the one shape that would
 * mislead.
 */
export function StudentAccountSection({ student }: { student: Student }) {
  const toggleAccount = useSetStudentAccountActive();
  const changePassword = useChangeStudentPassword();
  const showToast = useToast();

  const [confirmingLock, setConfirmingLock] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const isActive = student.is_account_active !== false;
  const hasAccount = typeof student.user_id === "number" && student.user_id > 0;

  /** Applies the account change and closes only once the API accepts it. */
  async function confirmLock(): Promise<void> {
    setLockError(null);

    try {
      await toggleAccount.mutateAsync({ id: student.id, isActive: !isActive });

      showToast({
        variant: "success",
        title: isActive
          ? `Đã khóa tài khoản của ${student.full_name}.`
          : `Đã mở lại tài khoản của ${student.full_name}.`,
      });
      setConfirmingLock(false);
    } catch (error) {
      setLockError(isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.");
    }
  }

  if (!hasAccount) {
    return (
      <p className="rounded-control border border-dashed border-vc-control p-[15px] text-[11px] leading-[1.6] text-muted-foreground">
        Hồ sơ này chưa có tài khoản đăng nhập.
      </p>
    );
  }

  return (
    <div className={cn("grid gap-[18px]", SHEET_FIELD_TYPE)}>
      <Field
        name="student-login-name"
        label="Tên đăng nhập"
        hint="Tên đăng nhập không đổi được sau khi tạo hồ sơ."
      >
        <Input
          id="student-login-name"
          readOnly
          aria-describedby="student-login-name-hint"
          value={student.username ?? ""}
          className={cn(SHEET_CONTROL, "bg-background font-mono text-muted-foreground")}
        />
      </Field>

      <AccountRow
        title={
          <>
            Trạng thái tài khoản
            <StatusBadge status={isActive ? "active" : "inactive"} />
          </>
        }
        description={
          isActive
            ? "Học sinh đăng nhập được và có thể thêm vào lớp mới."
            : "Học sinh không đăng nhập được; các lớp đang học giữ nguyên."
        }
        action={
          <Button
            type="button"
            variant="outline"
            disabled={toggleAccount.isPending}
            className="h-11 min-w-[148px] rounded-control border-vc-control text-[10px] max-sm:w-full"
            onClick={() => {
              setLockError(null);
              setConfirmingLock(true);
            }}
          >
            {isActive ? (
              <Lock aria-hidden="true" className="size-4" />
            ) : (
              <LockOpen aria-hidden="true" className="size-4" />
            )}
            {isActive ? "Khóa tài khoản" : "Mở lại tài khoản"}
          </Button>
        }
      />

      <AccountRow
        title="Mật khẩu đăng nhập"
        description="Mật khẩu hiện tại được bảo mật và không hiển thị ở đây."
        action={
          <Button
            type="button"
            variant="outline"
            className="h-11 min-w-[148px] rounded-control border-vc-control text-[10px] max-sm:w-full"
            onClick={() => setChangingPassword(true)}
          >
            <KeyRound aria-hidden="true" className="size-4" />
            Đặt lại mật khẩu
          </Button>
        }
      />

      <p className="text-[10px] leading-[1.6] text-muted-foreground">
        Hai thao tác trên áp dụng ngay khi xác nhận, không chờ nút Lưu thay đổi.
      </p>

      <ConfirmActionDialog
        open={confirmingLock}
        onOpenChange={(open) => (open ? undefined : setConfirmingLock(false))}
        title={isActive ? "Khóa tài khoản học sinh?" : "Mở lại tài khoản học sinh?"}
        description={
          isActive
            ? `${student.full_name} sẽ không đăng nhập được nữa, và sẽ không thêm được vào lớp mới. Trạng thái học tập và các lớp đang học giữ nguyên.`
            : `${student.full_name} sẽ đăng nhập lại được bằng mật khẩu hiện tại.`
        }
        confirmLabel={isActive ? "Khóa" : "Mở"}
        destructive={isActive}
        errorMessage={lockError}
        isPending={toggleAccount.isPending}
        onConfirm={() => void confirmLock()}
      />

      {changingPassword ? (
        <ChangePasswordDialog
          open
          onOpenChange={(open) => (open ? undefined : setChangingPassword(false))}
          subjectName={student.full_name}
          submit={(password) => changePassword.mutateAsync({ id: student.id, password })}
        />
      ) : null}
    </div>
  );
}
