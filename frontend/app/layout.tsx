import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/shared/app-providers";
import "@/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
