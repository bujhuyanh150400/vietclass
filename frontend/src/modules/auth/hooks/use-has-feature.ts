import { useCurrentUser } from "./use-current-user";
import { hasFeature } from "../utils/has-feature";

/** Reads one effective feature without exposing actions before the session is confirmed. */
export function useHasFeature(feature: string): boolean {
  const session = useCurrentUser(true);

  return session.isSuccess && hasFeature(session.data.features, feature);
}
