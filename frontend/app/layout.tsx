import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono, Silkscreen } from "next/font/google";

import { AppProviders } from "@/components/shared/app-providers";
import "@/styles.css";

// The entire interface is written in Vietnamese, so the UI face is one drawn for
// Vietnamese: Be Vietnam Pro carries the full diacritic set without the stacked
// tone marks clipping or drifting off their vowels.
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// A bitmap face for the wordmark only. It has no Vietnamese diacritics at all,
// which is precisely why it stays confined to the Latin-only brand name and
// never reaches the interface copy.
const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VietClasses",
    template: "%s | VietClasses",
  },
  description: "Nền tảng quản lý lớp học VietClasses.",
  // `app/favicon.ico` already covers the browser tab through the file
  // convention; only the sizes it cannot express are declared here.
  manifest: "/app-icons/web/site.webmanifest",
  icons: {
    apple: [{ url: "/app-icons/web/apple-touch-icon.png", sizes: "180x180" }],
  },
};

/**
 * Renders the Vietnamese document shell for every route and hands server
 * children to the client providers, so full-height auth and protected screens
 * inherit the same fonts, semantic colors, and URL/query state.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${silkscreen.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
