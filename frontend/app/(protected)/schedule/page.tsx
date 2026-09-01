import type { Metadata } from "next";

import { ScheduleCalendarContainer } from "@/modules/schedule";

export const metadata: Metadata = {
  title: "Lịch học",
};

/** Renders the system-wide lesson calendar. */
export default function SchedulePage() {
  return <ScheduleCalendarContainer />;
}
