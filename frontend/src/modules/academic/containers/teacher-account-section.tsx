"use client";

import { KeyRound, Lock, LockOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import { InfoDialog } from "@/components/shared/info-dialog";
import { Field } from "@/components/shared/field";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiClientError } from "@/lib/api/api-client-error";
import { cn } from "@/lib/utils/index";

import { ChangePasswordDialog } from "../components/change-password-dialog";
import { SHEET_FIELD_TYPE } from "../components/form-control";
import { useChangeTeacherPassword, useSetTeacherAccountActive } from "../hooks/use-teachers";
import type { Teacher } from "../types/academic";

/** Renders one account fact with its immediate action beside it. */
function TeacherAccountRow({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-control border border-vc-control bg-card p-[13px_14px] max-sm:grid-cols-1">
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

/** Presents the existing teacher account and keeps account actions outside profile save. */
export function TeacherAccountSection({ teacher }: { teacher: Teacher }) {
  const toggleAccount = useSetTeacherAccountActive();
  const changePassword = useChangeTeacherPassword();
  const showToast = useToast();

  const [confirmingLock, setConfirmingLock] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const isActive = teacher.is_account_active !== false;
  const hasAccount = typeof teacher.user_id === "number" && teacher.user_id > 0;

  /** Applies the account state change after the confirmation dialog accepts it. */
  async function confirmLock(): Promise<void> {
    setLockError(null);

    try {
      await toggleAccount.mutateAsync({ id: teacher.id, isActive: !isActive });

      showToast({
        variant: "success",
        title: isActive
          ? `Đã khóa tài khoản của ${teacher.full_name}.`
          : `Đã mở lại tài khoản của ${teacher.full_name}.`,
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
        name="teacher-login-name"
        label="Tên đăng nhập"
        hint="Tên đăng nhập không đổi được sau khi tạo hồ sơ."
      >
        <Input
          id="teacher-login-name"
          readOnly
          aria-describedby="teacher-login-name-hint"
          value={teacher.username ?? ""}
          size="control"
          className="bg-background font-mono text-muted-foreground"
        />
      </Field>

      <TeacherAccountRow
        title={
          <>
            Trạng thái tài khoản
            <StatusBadge status={isActive ? "active" : "inactive"} />
          </>
        }
        description={
          isActive
            ? "Giáo viên đăng nhập được vào không gian học vụ."
            : "Giáo viên không đăng nhập được; hồ sơ và dữ liệu học vụ vẫn giữ nguyên."
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
            {isActive ? <Lock aria-hidden="true" className="size-4" /> : <LockOpen aria-hidden="true" className="size-4" />}
            {isActive ? "Khóa tài khoản" : "Mở lại tài khoản"}
          </Button>
        }
      />

      <TeacherAccountRow
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
            Đổi mật khẩu
          </Button>
        }
      />

      <p className="text-[10px] leading-[1.6] text-muted-foreground">
        Hai thao tác trên áp dụng ngay khi xác nhận, không chờ nút Lưu thay đổi.
      </p>

      <InfoDialog
        open={confirmingLock}
        onOpenChange={(open) => (open ? undefined : setConfirmingLock(false))}
        title={isActive ? "Khóa tài khoản giáo viên?" : "Mở lại tài khoản giáo viên?"}
        description={
          isActive
            ? `${teacher.full_name} sẽ không đăng nhập được nữa; hồ sơ và dữ liệu học vụ vẫn giữ nguyên.`
            : `${teacher.full_name} sẽ đăng nhập lại được bằng mật khẩu hiện tại.`
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
          subjectName={teacher.full_name}
          submit={(password) => changePassword.mutateAsync({ id: teacher.id, password })}
        />
      ) : null}
    </div>
  );
}
