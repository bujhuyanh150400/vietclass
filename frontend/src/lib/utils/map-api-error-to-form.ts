import {
  SERVICE_FAILURE_MESSAGE,
  isApiClientError,
} from "@/lib/api/api-client-error";

/** Safe field-level and form-level messages produced from a normalized API error. */
export type ApiFormErrorResult<TField extends string> = {
  fieldErrors: Partial<Record<TField, string>>;
  formError: string | null;
};

/**
 * Maps the shared API error contract to the first message for each declared
 * form field, falling back to one safe form-level message when none match.
 */
export function mapApiErrorToForm<TField extends string>(
  error: unknown,
  fields: readonly TField[],
): ApiFormErrorResult<TField> {
  if (!isApiClientError(error)) {
    return {
      fieldErrors: {},
      formError: SERVICE_FAILURE_MESSAGE,
    };
  }

  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const field of fields) {
    const [message] = error.fieldErrors[field] ?? [];

    if (message !== undefined) {
      fieldErrors[field] = message;
    }
  }

  return {
    fieldErrors,
    formError: Object.keys(fieldErrors).length === 0 ? error.message : null,
  };
}
