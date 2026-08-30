import { LoadingState } from "@/components/shared/loading-state";

/**
 * Shows the shared loading overlay while a protected route segment loads, so
 * navigation inside the shell has immediate feedback.
 */
export default function ProtectedLoading() {
  return <LoadingState open />;
}
