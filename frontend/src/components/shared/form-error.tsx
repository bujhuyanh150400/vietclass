import type { ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";

/** Announces a form-level API error above either form layout. */
export function FormError({ message }: { message: ReactNode }) {
  return (
    <Alert variant="destructive" aria-live="polite">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
