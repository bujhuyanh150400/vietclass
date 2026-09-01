"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/api/api-client-error";

/**
 * Renders one record's screen only once that record has actually loaded.
 *
 * Edit forms take their default values once at mount, so showing the form before
 * the record arrives would leave the fields empty and quietly submit blanks. The
 * skeleton reserves the same geometry the form will occupy so nothing jumps.
 *
 * A record the API says does not exist is reported as such rather than as a
 * failure that can be retried, because retrying will not bring it back.
 */
export function ResourceLoader<TData>({
  query,
  notFoundMessage,
  children,
}: {
  query: UseQueryResult<TData>;
  notFoundMessage: string;
  children: (data: TData) => ReactNode;
}) {
  if (query.data !== undefined) {
    return <>{children(query.data)}</>;
  }

  if (query.isPending) {
    return (
      <div aria-hidden="true" className="grid max-w-3xl gap-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-9 w-40" />
      </div>
    );
  }

  const isMissing = isApiClientError(query.error) && query.error.status === 404;

  return (
    <Alert variant="destructive" className="max-w-3xl">
      <AlertTitle>{isMissing ? "Không tìm thấy" : "Không tải được dữ liệu"}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <p>
          {isMissing
            ? notFoundMessage
            : isApiClientError(query.error)
              ? query.error.message
              : "Vui lòng thử lại."}
        </p>
        {isMissing ? null : (
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
