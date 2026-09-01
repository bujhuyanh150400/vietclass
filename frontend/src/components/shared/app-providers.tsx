"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";

/**
 * Creates the single browser QueryClient with defaults that keep freshly
 * rendered server data authoritative, so hydration does not trigger an
 * immediate duplicate request for data the page already has.
 *
 * `staleTime` alone does that job. Mounting is deliberately left on React
 * Query's default, because a list screen is unmounted while its create form is
 * open: suppressing the mount refetch would leave the query the mutation just
 * invalidated serving its old rows when the form redirects back to the list.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/**
 * Wraps server-rendered children with the client-side query cache and the
 * nuqs URL-state adapter, keeping those browser-only providers out of the root
 * layout so route segments stay Server Components.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
}
