import { Loader2 } from "lucide-react";
import { Controller } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { LoginFormViewModel } from "../hooks/use-login-form";
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
          aria-invalid={username.error === undefined ? undefined : true}
          aria-describedby={
            username.error === undefined ? undefined : "username-error"
          }
          {...username}
        />
        {username.error === undefined ? null : (
          <p id="username-error" className="text-sm text-destructive">
            {username.error}
          </p>
        )}
      </div>

      <PasswordField
        id="password"
        label="Mật khẩu"
        autoComplete="current-password"
        error={password.error}
        {...password}
      />

      <div className="flex items-center gap-2">
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
