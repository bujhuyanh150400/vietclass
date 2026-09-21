"use client";

import type { ReactNode } from "react";
import { useOffline } from "next/offline";

import { OfflinePage } from "./offline-page";

/** Replaces application content while Next reports that browser connectivity is unavailable. */
export function ConnectivityBoundary({ children }: { children: ReactNode }) {
  return useOffline() ? <OfflinePage /> : children;
}
