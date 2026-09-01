"use client";

import { useState } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ClassesView } from "../components/classes-view";
import { ConfirmActionDialog } from "../components/confirm-action-dialog";
import { useChangeClassStatus, useClassList } from "../hooks/use-classes";
import type { SchoolClass } from "../types/academic";

/**
 * Coordinates the class list and the status change behind it.
 *
 * Ending a class is close to a one-way door — it closes every enrolment still open,
 * and reopening does not bring them back — so the confirmation says exactly that
 * and names how many students it affects.
 */
export function ClassesContainer() {
  const list = useClassList();
  const changeStatus = useChangeClassStatus();
  const showToast = useToast();

  const [target, setTarget] = useState<SchoolClass | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Applies the status change and closes only once the API accepts it. */
  async function confirm() {
    if (target === null) {
      return;
    }

    setActionError(null);

    try {
      const wasRunning = target.status === 0;

      await changeStatus.mutateAsync({
        id: target.id,
        status: wasRunning ? 1 : 0,
      });

      showToast({
        variant: "success",
        title: wasRunning
          ? `Đã kết thúc lớp "${target.name}".`
          : `Đã mở lại lớp "${target.name}".`,
      });
      setTarget(null);
    } catch (error) {
      setActionError(
        isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.",
      );
    }
  }

  const ending = target?.status === 0;
  const enrolled = target?.active_students_count ?? 0;

  return (
    <>
      <ClassesView
        state={list.state}
        meta={list.meta}
        search={list.query.q}
        onSearchChange={list.query.setSearch}
        onPageChange={list.query.setPage}
        onChangeStatus={(schoolClass) => {
          setActionError(null);
          setTarget(schoolClass);
        }}
      />

      <ConfirmActionDialog
        open={target !== null}
        onOpenChange={(open) => (open ? undefined : setTarget(null))}
        title={ending ? "Kết thúc lớp học?" : "Mở lại lớp học?"}
        description={
          target === null
            ? ""
            : ending
              ? `Lớp "${target.name}" sẽ kết thúc và ${enrolled} học sinh đang học sẽ được cho nghỉ lớp theo ngày hôm nay. Mở lại lớp sau đó sẽ không khôi phục danh sách này.`
              : `Lớp "${target.name}" sẽ hoạt động trở lại. Danh sách học sinh đã bị đóng khi kết thúc lớp sẽ không được khôi phục; cần thêm lại từng học sinh.`
        }
        confirmLabel={ending ? "Kết thúc lớp" : "Mở lại"}
        destructive={ending}
        errorMessage={actionError}
        isPending={changeStatus.isPending}
        onConfirm={() => void confirm()}
      />
    </>
  );
}
