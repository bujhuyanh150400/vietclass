import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { SchoolClass } from "../types/academic";
import { CLASS_STATUS_LABELS, GRADE_LEVEL_LABELS, formatDate } from "../utils/labels";

/**
 * Renders the facts about one class above its roster: what it teaches, who runs it,
 * how full it is, and when it runs.
 *
 * A finished class says so plainly here, because every enrolment action below is
 * refused once it is, and finding that out one refusal at a time would be worse.
 */
export function ClassSummary({ schoolClass }: { schoolClass: SchoolClass }) {
  const facts: { label: string; value: string }[] = [
    { label: "Mã lớp", value: schoolClass.code },
    { label: "Môn học", value: schoolClass.subject_name ?? "—" },
    { label: "Khối", value: GRADE_LEVEL_LABELS[schoolClass.grade_level] },
    { label: "Giáo viên", value: schoolClass.teacher_name ?? "—" },
    {
      label: "Sĩ số",
      value: `${schoolClass.active_students_count ?? 0}/${schoolClass.max_students}`,
    },
    { label: "Khai giảng", value: formatDate(schoolClass.start_at) },
    { label: "Kết thúc", value: formatDate(schoolClass.end_at) },
  ];

  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{schoolClass.name}</h2>
              <Badge variant={schoolClass.status === 0 ? "default" : "secondary"}>
                {CLASS_STATUS_LABELS[schoolClass.status]}
              </Badge>
            </div>
            {schoolClass.status === 0 ? null : (
              <p className="text-sm text-muted-foreground">
                Lớp đã kết thúc, không thay đổi được danh sách học sinh.
              </p>
            )}
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/academic/classes/${schoolClass.id}/edit`}>
              <Pencil aria-hidden="true" />
              Sửa lớp
            </Link>
          </Button>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
