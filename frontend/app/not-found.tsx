import { NotFoundState } from "@/components/shared/not-found-state";

/**
 * Renders the application-wide 404 screen when no route segment can resolve
 * the requested URL.
 */
export default function NotFound() {
  return <NotFoundState returnHref="/" returnLabel="Về trang chủ" />;
}
