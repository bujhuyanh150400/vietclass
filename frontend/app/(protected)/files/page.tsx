import type { Metadata } from "next";

import { FileManagerContainer } from "@/modules/files";

export const metadata: Metadata = { title: "Tệp của tôi" };

/** Renders the authenticated private file library route. */
export default function FilesPage() {
  return <FileManagerContainer />;
}
