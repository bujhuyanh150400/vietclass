"use client";

import { Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { FilePondInput, type FilePondProcess } from "./filepond-input";

/** Renders the constrained, one-request-per-file library upload surface. */
export function FileUploadPanel({
  canUpload,
  disabledReason,
  process,
}: {
  canUpload: boolean;
  disabledReason?: string;
  process: FilePondProcess;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Upload aria-hidden="true" className="size-5" />Tải tệp lên</CardTitle>
        <CardDescription>Tối đa 30 tệp, mỗi tệp 25 MB. Tệp được lưu riêng tư.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {disabledReason ? <Alert><AlertDescription>{disabledReason}</AlertDescription></Alert> : null}
        <FilePondInput
          mode="files"
          maxFiles={30}
          disabled={!canUpload}
          labelIdle={'Kéo thả tệp hoặc <span class="filepond--label-action">chọn tệp</span>'}
          process={process}
        />
      </CardContent>
    </Card>
  );
}
