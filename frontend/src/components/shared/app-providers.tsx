"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";

/**
 * Creates the single browser QueryClient with defaults that keep freshly
 * rendered server data authoritative, so hydration does not trigger an
 * immediate duplicate request for data the page already has.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnMount: false,
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
