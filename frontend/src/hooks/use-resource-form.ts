"use client";

import { useState, type BaseSyntheticEvent } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";

import { useToast } from "@/components/shared/toast-provider";
import { mapApiErrorToForm } from "@/lib/utils";

/** What the error toast says when every refusal landed on a field. */
const FIELD_REFUSAL_MESSAGE = "Vui lòng kiểm tra lại các trường được đánh dấu.";

/** What a form screen renders and submits. */
export type ResourceFormViewModel<TInput extends FieldValues, TOutput extends FieldValues> = {
  form: UseFormReturn<TInput, unknown, TOutput>;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  alertMessage: string | null;
  isSubmitting: boolean;
};

/**
 * Owns the state every create and edit screen shares: validation, one
 * submission, and what to do with the answer.
 *
 * A `422` is split back onto the fields it names, so a duplicate subject name or
 * class code lands on the input that caused it rather than in a banner. Anything
 * the API reports about state instead of shape — a locked subject, a full class —
 * has no field to attach to and is shown as one form-level message.
 *
 * A form that passes `successMessage` also announces both outcomes as a toast.
 * A create screen redirects the moment it succeeds, so the only evidence the save
 * happened would otherwise be a list that looks slightly different; and its
 * form-level message sits above fields the submit button may have scrolled well
 * past. The toast outlives the redirect and does not depend on scroll position.
 */
export function useResourceForm<TInput extends FieldValues, TOutput extends FieldValues>({
  resolver,
  defaultValues,
  fieldNames,
  submit,
  onSuccess,
  successMessage,
}: {
  resolver: Resolver<TInput, unknown, TOutput>;
  defaultValues: DefaultValues<TInput>;
  fieldNames: readonly Path<TInput>[];
  submit: (values: TOutput) => Promise<unknown>;
  onSuccess: () => void;
  successMessage?: string;
}): ResourceFormViewModel<TInput, TOutput> {
  const [formError, setFormError] = useState<string | null>(null);
  const showToast = useToast();

  const form = useForm<TInput, unknown, TOutput>({ resolver, defaultValues });

  /** Sends one validated payload and reports whatever the API decided about it. */
  async function handleSubmit(values: TOutput) {
    setFormError(null);

    try {
      await submit(values);

      if (successMessage !== undefined) {
        showToast({ variant: "success", title: successMessage });
      }

      onSuccess();
    } catch (error) {
      const mapped = mapApiErrorToForm(error, fieldNames as readonly string[]);

      for (const field of fieldNames) {
        const message = mapped.fieldErrors[field as string];

        if (message !== undefined) {
          form.setError(field, { message });
        }
      }

      setFormError(mapped.formError);

      if (successMessage !== undefined) {
        showToast({
          variant: "error",
          title: "Chưa lưu được",
          description: mapped.formError ?? FIELD_REFUSAL_MESSAGE,
        });
      }
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(handleSubmit),
    alertMessage: formError,
    isSubmitting: form.formState.isSubmitting,
  };
}
