import { LoadingState } from "@/components/shared/loading-state";

/**
 * Shows the shared loading overlay while an Academic route segment loads inside
 * the authenticated shell.
 */
export default function AcademicLoading() {
  return <LoadingState open />;
}
