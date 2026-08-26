import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const errorId = `${inputId}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={inputId}
          type={isVisible ? "text" : "password"}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={error === undefined ? undefined : errorId}
          className={cn("pr-10", className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={isVisible}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      {error === undefined ? null : (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
