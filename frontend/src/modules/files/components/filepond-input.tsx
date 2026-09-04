"use client";

import dynamic from "next/dynamic";

import type { FilePondClientProps } from "./filepond-client";

const FilePondClient = dynamic(
  () => import("./filepond-client").then((module) => module.FilePondClient),
  { ssr: false },
);

/** Client-only public boundary for FilePond's browser and canvas dependencies. */
export function FilePondInput(props: FilePondClientProps) {
  return <FilePondClient {...props} />;
}

export type { FilePondClientProps, FilePondProcess, FilePondProcessHandlers } from "./filepond-client";
