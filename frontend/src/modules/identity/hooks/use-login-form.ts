"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState, type BaseSyntheticEvent } from "react";
import {
  useForm,
  type Control,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { mapApiErrorToForm } from "@/lib/utils";

import { loginSchema, type LoginFormInput, type LoginFormValues } from "@/modules/identity";
import { sanitizeReturnTo } from "@/modules/identity";
import { useLogin } from "./use-login";

/** Shown when the protected area sent the visitor back with an expired session. */
const EXPIRED_SESSION_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";

/** Fields the API may return validation messages for. */
const FORM_FIELDS = ["username", "password"] as const;

/** A registered text field plus the safe message the view should display. */
type LoginTextField =
  | (UseFormRegisterReturn<"username"> & { error?: string })
  | (UseFormRegisterReturn<"password"> & { error?: string });

/** Props and callbacks required to render and submit the login form. */
export type LoginFormViewModel = {
  username: LoginTextField;
  password: LoginTextField;
  control: Control<LoginFormInput, unknown, LoginFormValues>;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  alertMessage: string | null;
  isSubmitting: boolean;
};

/**
 * Owns login form state, validation, submission feedback, URL state, and
 * successful navigation so the form component remains presentational.
 */
export function useLoginForm(): LoginFormViewModel {
  const router = useRouter();
  const login = useLogin();
  const [returnTo] = useQueryState("returnTo");
  const [reason, setReason] = useQueryState("reason");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", remember: false },
  });

  /** Sends one validated attempt and navigates after the BFF accepts it. */
  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    void setReason(null);

    try {
      await login.mutateAsync(values);
      router.replace(sanitizeReturnTo(returnTo));
      router.refresh();
    } catch (error) {
      const mappedError = mapApiErrorToForm(error, FORM_FIELDS);

      for (const field of FORM_FIELDS) {
        const message = mappedError.fieldErrors[field];

        if (message !== undefined) {
          form.setError(field, { message });
        }
      }

      setFormError(mappedError.formError);
    }
  }

  const usernameError = form.formState.errors.username?.message;
  const passwordError = form.formState.errors.password?.message;

  return {
    username: {
      ...form.register("username"),
      error: usernameError,
    },
    password: {
      ...form.register("password"),
      error: passwordError,
    },
    control: form.control,
    onSubmit: form.handleSubmit(onSubmit),
    alertMessage:
      formError ?? (reason === "expired" ? EXPIRED_SESSION_MESSAGE : null),
    isSubmitting: form.formState.isSubmitting || login.isPending,
  };
}
