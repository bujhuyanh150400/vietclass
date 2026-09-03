import type { NextConfig } from "next";

/**
 * Hostname or pattern the dev server accepts requests from. The app and the API sit
 * on separate hostnames in development so the session cookie is exercised
 * cross-origin the way production will be, and the dev server answers only the
 * hostname it was started with unless the others are named here.
 *
 * Development only; production is unaffected.
 */
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

if (process.env.NODE_ENV === "development" && !ALLOWED_ORIGIN) {
  throw new Error("ALLOWED_ORIGIN must be set in development.");
}

const nextConfig: NextConfig = {
  ...(ALLOWED_ORIGIN ? { allowedDevOrigins: [ALLOWED_ORIGIN] } : {}),
};

export default nextConfig;
