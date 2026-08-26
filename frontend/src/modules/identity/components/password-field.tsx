import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { LOGIN_INPUT_CLASS, LoginFieldShell } from "./login-field-shell";

/**
 * Renders the password input together with a keyboard-reachable reveal toggle.
 * Toggling only switches the input type, so the entered value and caret survive,
 * and the control's accessible name states the action it will perform.
 */
export function PasswordField({
  label,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; error?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const fallbackId = useId();
  const inputId = props.id ?? fallbackId;

  return (
    <LoginFieldShell inputId={inputId} label={label} error={error}>
      <Input
        {...props}
        id={inputId}
        type={isVisible ? "text" : "password"}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : `${inputId}-error`}
        className={cn(LOGIN_INPUT_CLASS, "pr-1", className)}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={isVisible}
        className="mr-1.5 grid size-9 shrink-0 place-content-center rounded-[2px] text-vc-text-muted transition-colors hover:bg-vc-line/10 hover:text-vc-text focus-visible:text-vc-text focus-visible:outline-[2px] focus-visible:-outline-offset-2 focus-visible:outline-vc-line"
      >
        {isVisible ? (
          <EyeOff aria-hidden="true" className="size-4.5" />
        ) : (
          <Eye aria-hidden="true" className="size-4.5" />
        )}
      </button>
    </LoginFieldShell>
  );
}
