"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SERVICE_FAILURE_MESSAGE,
  isApiClientError,
} from "@/lib/api/api-client-error";

import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginFormInput, type LoginFormValues } from "@/modules/identity";
import { sanitizeReturnTo } from "@/modules/identity";
import { PasswordField } from "./password-field";

/** Shown when the protected area sent the visitor back with an expired session. */
const EXPIRED_SESSION_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

/** Fields the API may return validation messages for. */
const FORM_FIELDS = ["username", "password"] as const;

/**
 * Renders the interactive sign-in form. Credentials are validated in the browser
 * before any request, submitted once per attempt, and on success the visitor is
 * replaced onto a sanitized return destination with server data refreshed.
 */
export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [returnTo] = useQueryState("returnTo");
  const [reason, setReason] = useQueryState("reason");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", remember: false },
  });

  /**
   * Turns a failed login into user-visible feedback: `422` messages land on the
   * fields they belong to, and every other failure becomes one safe alert
   * message. Entered values are never cleared, so the attempt can be corrected.
   */
  function showLoginFailure(error: unknown) {
    if (!isApiClientError(error)) {
      setFormError(SERVICE_FAILURE_MESSAGE);

      return;
    }

    const mappedFields = FORM_FIELDS.filter(
      (field) => (error.fieldErrors[field]?.length ?? 0) > 0,
    );

    for (const field of mappedFields) {
      form.setError(field, { message: error.fieldErrors[field][0] });
    }

    if (mappedFields.length === 0) {
      setFormError(error.message);
    }
  }

  /**
   * Sends one validated attempt to the login route and navigates to the
   * sanitized return destination when it succeeds.
   */
  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    void setReason(null);

    try {
      await login.mutateAsync(values);
      router.replace(sanitizeReturnTo(returnTo));
      router.refresh();
    } catch (error) {
      showLoginFailure(error);
    }
  }

  const alertMessage =
    formError ?? (reason === "expired" ? EXPIRED_SESSION_MESSAGE : null);
  const isSubmitting = form.formState.isSubmitting || login.isPending;

  return (
    <form
      noValidate
      // `method="post"` never runs while the client is healthy, but it stops a
      // form submitted before hydration from putting the password in the URL.
      method="post"
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5"
    >
      <div aria-live="polite" role="status">
        {alertMessage === null ? null : (
          <Alert variant="destructive">
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="username">Tên đăng nhập</Label>
        <Input
          id="username"
          autoComplete="username"
          autoFocus
          aria-invalid={form.formState.errors.username === undefined ? undefined : true}
          aria-describedby={
            form.formState.errors.username === undefined ? undefined : "username-error"
          }
          {...form.register("username")}
        />
        {form.formState.errors.username === undefined ? null : (
          <p id="username-error" className="text-sm text-destructive">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      <PasswordField
        id="password"
        label="Mật khẩu"
        autoComplete="current-password"
        error={form.formState.errors.password?.message}
        {...form.register("password")}
      />

      <div className="flex items-center gap-2">
        <Controller
          control={form.control}
          name="remember"
          render={({ field }) => (
            <Checkbox
              id="remember"
              ref={field.ref}
              name={field.name}
              checked={field.value ?? false}
              onBlur={field.onBlur}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="remember" className="font-normal">
          Ghi nhớ đăng nhập
        </Label>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : null}
        Đăng nhập
      </Button>
    </form>
  );
}
