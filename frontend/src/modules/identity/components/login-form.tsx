import { Loader2 } from "lucide-react";
import { Controller } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { LoginFormViewModel } from "../hooks/use-login-form";
import { LOGIN_INPUT_CLASS, LoginFieldShell } from "./login-field-shell";
import { PasswordField } from "./password-field";

/**
 * Renders the sign-in form from a view model supplied by its container; all
 * validation, submission, navigation, and error mapping stay outside this view.
 */
export function LoginForm({
  username,
  password,
  control,
  onSubmit,
  alertMessage,
  isSubmitting,
}: LoginFormViewModel) {
  return (
    <form
      noValidate
      // `method="post"` never runs while the client is healthy, but it stops a
      // form submitted before hydration from putting the password in the URL.
      method="post"
      onSubmit={onSubmit}
      className="flex flex-col"
    >
      {/* The live region stays mounted so the first submission failure is
          announced; `:empty` keeps it from reserving space until it has one. */}
      <div
        aria-live="polite"
        role="status"
        className="grid [&:not(:empty)]:mb-6"
      >
        {alertMessage === null ? null : (
          <p
            // The wrapper already carries the live region; a nested `alert`
            // role would announce the same message a second time.
            className="rounded-[3px] border-2 border-vc-ember bg-vc-surface-raised px-4 py-3 text-[0.875rem] font-medium text-vc-ember shadow-[3px_3px_0_0_var(--vc-ember)]"
          >
            {alertMessage}
          </p>
        )}
      </div>

      <div className="grid gap-5">
        <LoginFieldShell
          inputId="username"
          label="Tên đăng nhập"
          error={username.error}
        >
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            aria-invalid={username.error === undefined ? undefined : true}
            aria-describedby={
              username.error === undefined ? undefined : "username-error"
            }
            className={LOGIN_INPUT_CLASS}
            {...username}
          />
        </LoginFieldShell>

        <PasswordField
          id="password"
          label="Mật khẩu"
          autoComplete="current-password"
          error={password.error}
          {...password}
        />
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Checkbox
              id="remember"
              ref={field.ref}
              name={field.name}
              checked={field.value ?? false}
              onBlur={field.onBlur}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              className="size-5 rounded-[3px] border-2 border-vc-line bg-vc-surface-raised shadow-none data-[state=checked]:border-vc-line data-[state=checked]:bg-vc-orange data-[state=checked]:text-vc-ink focus-visible:border-vc-line focus-visible:ring-0 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-vc-line dark:bg-vc-surface-raised dark:data-[state=checked]:bg-vc-orange"
            />
          )}
        />
        <Label
          htmlFor="remember"
          className="text-[0.875rem] font-normal text-vc-text-muted"
        >
          Ghi nhớ đăng nhập
        </Label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "vc-key mt-7 inline-flex h-13 w-full items-center justify-center gap-2.5",
          "text-[0.95rem] font-extrabold tracking-[0.01em] text-vc-ink",
          isSubmitting
            ? "cursor-default bg-vc-orange-deep"
            : "bg-vc-orange hover:bg-[#ff7d21]",
        )}
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
        ) : null}
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
