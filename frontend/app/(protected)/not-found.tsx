import { NotFoundState } from "@/components/shared/not-found-state";

/**
 * Keeps a missing protected route inside the authenticated shell and directs
 * the user back to its safe landing page.
 */
export default function ProtectedNotFound() {
  return <NotFoundState returnHref="/dashboard" returnLabel="Về trang tổng quan" />;
}
