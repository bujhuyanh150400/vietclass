"use client";

import { InfoDialog, InfoDialogCloseAction } from "@/components/shared/info-dialog";

import type { Subject } from "../types/academic";
import { SubjectClassCount, SubjectGradeLevels, SubjectStatusBadge } from "./subject-cells";

/** Shows the subject details already present in the list without another request. */
export function SubjectDetailDialog({
  subject,
  onClose,
}: {
  subject: Subject | null;
  onClose: () => void;
}) {
  return (
    <InfoDialog
      open={subject !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Chi tiết môn học"
      description={subject === null ? "" : `${subject.name} — thông tin môn học đang lưu.`}
      footer={<InfoDialogCloseAction />}
    >
      {subject === null ? null : (
        <div className="grid gap-5">
          <div className="flex items-start justify-between gap-4 border-b border-vc-rule pb-4">
            <div className="min-w-0">
              <span className="mb-1 block text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                Môn học
              </span>
              <h3 className="truncate text-xl font-semibold">{subject.name}</h3>
            </div>
            <SubjectStatusBadge subject={subject} />
          </div>

          <dl className="grid gap-4 text-[13px] sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="mb-1 block text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                Mô tả
              </dt>
              <dd className={subject.description ? "leading-relaxed" : "text-muted-foreground italic"}>
                {subject.description ?? "Chưa có mô tả"}
              </dd>
            </div>
            <div>
              <dt className="mb-2 block text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                Khối áp dụng
              </dt>
              <dd>
                <SubjectGradeLevels subject={subject} limit={subject.grade_levels.length} />
              </dd>
            </div>
            <div>
              <dt className="mb-2 block text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                Lớp đang sử dụng
              </dt>
              <dd>
                <SubjectClassCount subject={subject} />
              </dd>
            </div>
          </dl>
        </div>
      )}
    </InfoDialog>
  );
}
