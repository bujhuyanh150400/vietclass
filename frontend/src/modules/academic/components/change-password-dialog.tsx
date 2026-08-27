"use client";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { useResourceForm } from "../hooks/use-resource-form";
import {
  passwordFormSchema,
  type PasswordFormInput,
  type PasswordFormValues,
} from "../schemas/academic-form-schema";
import { Field, fieldAria } from "./field";

/** Fields the API may report validation messages for. */
const FIELDS = ["password"] as const;

/**
 * Collects a replacement password for one profile's login account.
 *
 * The dialog states plainly that existing sessions survive the change, because a
 * reader could reasonably expect the opposite and would otherwise assume a device
 * had been signed out when it had not.
 */
export function ChangePasswordDialog({
  open,
  onOpenChange,
  subjectName,
  submit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  submit: (password: string) => Promise<unknown>;
}) {
  const { form, onSubmit, alertMessage, isSubmitting } = useResourceForm<
    PasswordFormInput,
    PasswordFormValues
  >({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "" },
    fieldNames: FIELDS,
    submit: (values) => submit(values.password),
    onSuccess: () => {
      form.reset({ password: "" });
      onOpenChange(false);
    },
  });

  const error = form.formState.errors.password?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Đặt mật khẩu mới cho tài khoản của {subjectName}. Các phiên đăng nhập
              hiện tại vẫn tiếp tục hoạt động.
            </DialogDescription>
          </DialogHeader>

          {alertMessage === null ? null : (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{alertMessage}</AlertDescription>
            </Alert>
          )}

          <Field name="password" label="Mật khẩu mới" required error={error}>
            <Input
              {...form.register("password")}
              {...fieldAria("password", error)}
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu…" : "Đổi mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
