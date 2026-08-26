import { redirect } from "next/navigation";

/**
 * Sends the application root to the dashboard, which is the only landing
 * destination; the protected layout then decides whether a session exists.
 */
export default function HomePage() {
  redirect("/dashboard");
}
