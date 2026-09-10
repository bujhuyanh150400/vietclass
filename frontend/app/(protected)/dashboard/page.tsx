import type { Metadata } from "next";

import { DashboardView } from "@/modules/dashboard";

export const metadata: Metadata = {
  title: "Trang chủ",
};

/**
 * Renders the dashboard route. Authentication is already established by the
 * protected layout, so this file only composes the module screen.
 */
export default function DashboardPage() {
  return <DashboardView />;
}
