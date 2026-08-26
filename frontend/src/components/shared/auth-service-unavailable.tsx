import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Renders the retryable failure screen used when the authentication service
 * cannot be reached. It deliberately offers a retry rather than a sign-in prompt,
 * so an outage is never presented to the visitor as a rejected session.
 */
export function AuthServiceUnavailable({
  message,
  retryHref,
}: {
  message: string;
  retryHref: string;
}) {
  return (
    <div className="flex min-h-svh grow items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-md gap-4">
        <Alert variant="destructive">
          <AlertTitle>Không kết nối được dịch vụ xác thực</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={retryHref}>Thử lại</Link>
        </Button>
      </div>
    </div>
  );
}
