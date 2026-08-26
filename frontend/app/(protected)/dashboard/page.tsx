import type { Metadata } from "next";

import { DashboardScreen } from "@/modules/dashboard";

export const metadata: Metadata = {
  title: "Tổng quan",
};

/**
 * Renders the dashboard route. Authentication is already established by the
 * protected layout, so this file only composes the module screen.
 */
export default function DashboardPage() {
  return <DashboardScreen />;
}
