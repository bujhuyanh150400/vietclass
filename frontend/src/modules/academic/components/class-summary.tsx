import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, BookOpen, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type { SchoolClass } from "../types/academic";
import {
  CLASS_STATUS_LABELS,
  GRADE_LEVEL_LABELS,
  TEACHER_STATUS_LABELS,
  formatDate,
} from "../utils/labels";

/** Show class facts, complete subject set, hard capacity, and every teaching role. */
export function ClassSummary({
  schoolClass,
  onGoStudents,
}: {
  schoolClass: SchoolClass;
  onGoStudents: () => void;
}) {
  const enrolled = schoolClass.active_students_count ?? 0;
  const remaining = Math.max(0, schoolClass.max_students - enrolled);
  const ended = schoolClass.status !== 0;
  const capacityMessage = ended
    ? "Lớp đã kết thúc; các kỳ đang học đã được đóng."
    : remaining > 0
      ? `Còn ${remaining} chỗ trống. Ghi danh theo lô và chuyển lớp đều tuân theo giới hạn này.`
      : "Lớp đã đủ sĩ số. Không thể thêm học sinh hoặc chuyển lớp vào.";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
      <div className="grid content-start gap-4">
        <Card>
          <CardContent className="grid gap-4">
            <header className="grid gap-1 border-b border-vc-rule pb-3">
              <h3 className="font-semibold">Thông tin lớp</h3>
              <p className="text-xs text-muted-foreground">Mã lớp và ngày khai giảng được giữ cố định sau khi tạo.</p>
            </header>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <Fact label="Mã lớp" value={<span className="font-mono">{schoolClass.code}</span>} />
              <Fact label="Khối" value={GRADE_LEVEL_LABELS[schoolClass.grade_level]} />
              <Fact label="Ngày khai giảng" value={formatDate(schoolClass.start_at)} />
              <Fact label="Ngày kết thúc" value={formatDate(schoolClass.end_at)} />
              <Fact
                label="Trạng thái lớp"
                value={(
                  <Badge variant={ended ? "secondary" : "default"}>
                    {CLASS_STATUS_LABELS[schoolClass.status]}
                  </Badge>
                )}
              />
              <Fact label="Ngày tạo" value={formatDate(schoolClass.created_at?.slice(0, 10))} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-vc-rule pb-3">
              <div className="grid gap-1">
                <h3 className="font-semibold">Môn học của lớp</h3>
                <p className="text-xs text-muted-foreground">Học sinh ghi danh theo toàn lớp và học tất cả môn dưới đây.</p>
              </div>
              <Badge variant="secondary">{schoolClass.subjects.length} môn</Badge>
            </header>
            {schoolClass.subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Lớp chưa được gán môn học.</p>
            ) : (
              <ul className="grid gap-2">
                {schoolClass.subjects.map((subject) => (
                  <li key={subject.id} className="flex flex-wrap items-center gap-3 rounded-control border border-vc-rule bg-background px-3 py-2.5">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-vc-rule bg-vc-tint">
                      <BookOpen className="size-4 text-muted-foreground" />
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <strong className="text-sm">{subject.name}{subject.is_primary ? " · Môn chính" : ""}</strong>
                      <span className="text-xs text-muted-foreground">
                        Áp dụng {subject.grade_levels.map((grade) => GRADE_LEVEL_LABELS[grade]).join(", ")}
                      </span>
                    </span>
                    <Badge variant={subject.is_active ? "secondary" : "outline"}>
                      {subject.is_active ? "Đang mở" : "Đã khóa"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex items-start gap-2 border-t border-vc-rule pt-3 text-xs leading-relaxed text-muted-foreground">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>Chuyển lớp chỉ được sang lớp cùng khối và có đúng cùng tập môn học này.</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-4">
        <Card>
          <CardContent className="grid gap-4">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-vc-rule pb-3">
              <div className="grid gap-1">
                <h3 className="font-semibold">Sĩ số</h3>
                <p className="text-xs text-muted-foreground">Giới hạn cứng, không có ngoại lệ.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={onGoStudents}>
                <Users aria-hidden="true" />
                Xem học sinh
              </Button>
            </header>
            <div className="grid gap-2">
              <p className="flex items-baseline gap-1.5">
                <strong className="text-2xl tabular-nums">{enrolled}</strong>
                <span className="text-sm text-muted-foreground">/ {schoolClass.max_students} học sinh đang học</span>
              </p>
              <Progress
                value={schoolClass.max_students > 0 ? (enrolled / schoolClass.max_students) * 100 : 0}
                aria-label={`${enrolled} trên ${schoolClass.max_students} học sinh đang học`}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">{capacityMessage}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-vc-rule pb-3">
              <div className="grid gap-1">
                <h3 className="font-semibold">Đội ngũ giảng dạy</h3>
                <p className="text-xs text-muted-foreground">
                  1 phụ trách · {schoolClass.assistant_teachers.length} trợ giảng. Trạng thái lấy từ hồ sơ giáo viên.
                </p>
              </div>
              <Button asChild type="button" size="sm" variant="outline">
                <Link href={`/academic/classes/${schoolClass.id}/edit`}>Sửa đội ngũ</Link>
              </Button>
            </header>
            <ul className="grid gap-2">
              <TeacherRow
                id={schoolClass.teacher_id}
                name={schoolClass.teacher_name ?? "Chưa có giáo viên phụ trách"}
                status={schoolClass.teacher_status ?? null}
                role="Phụ trách"
              />
              {schoolClass.assistant_teachers.map((teacher) => (
                <TeacherRow
                  key={teacher.id}
                  id={teacher.id}
                  name={teacher.name ?? `Giáo viên #${teacher.id}`}
                  status={teacher.status}
                  role="Trợ giảng"
                />
              ))}
            </ul>
            {schoolClass.assistant_teachers.length === 0 ? (
              <p className="flex items-start gap-2 border-t border-vc-rule pt-3 text-xs leading-relaxed text-muted-foreground">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                Lớp chưa có trợ giảng. Có thể thêm trong biểu mẫu sửa lớp.
              </p>
            ) : null}
            {ended ? (
              <p className="flex items-start gap-2 border-t border-vc-rule pt-3 text-xs leading-relaxed text-muted-foreground">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                Lớp đã kết thúc giữ nguyên đội ngũ như dữ liệu lịch sử, kể cả giáo viên đã nghỉ.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Display one class fact with matching definition-list semantics. */
function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-vc-rule pb-2 last:border-b-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

/** Link an assigned teacher and label the role and employment status. */
function TeacherRow({
  id,
  name,
  status,
  role,
}: {
  id: number;
  name: string;
  status: 0 | 1 | null;
  role: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-vc-rule bg-background px-3 py-2.5">
      <Link href={`/academic/teachers/${id}?tab=classes`} className="min-w-0 font-medium hover:underline">
        {name}
      </Link>
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{role}</Badge>
        {status === null ? null : (
          <Badge variant={status === 0 ? "secondary" : "outline"}>
            {TEACHER_STATUS_LABELS[status]}
          </Badge>
        )}
      </span>
    </li>
  );
}
