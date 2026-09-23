import Link from "next/link";

import type { Guardian } from "../types/academic";
import {
  guardianDetailProfileFacts,
  guardianDetailStudentLabel,
} from "../utils/guardian-list-controls";

/** Presents guardian contact fields and the ordered linked-student roster. */
export function GuardianDetailView({ guardian }: { guardian: Guardian }) {
  const facts = guardianDetailProfileFacts(guardian);

  return (
    <div className="grid gap-4 rounded-lg border bg-card p-5">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">{facts.map((fact, index) => <div key={fact.label} className={index === facts.length - 1 ? "sm:col-span-2" : undefined}><dt className="text-muted-foreground">{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
      <div><h2 className="font-semibold">Học sinh liên kết</h2><ul className="mt-2 grid gap-2">{guardian.students.map((student) => <li key={student.id}><Link className="underline" href={`/academic/students/${student.id}`}>{student.full_name}</Link><span className="text-sm text-muted-foreground"> · {guardianDetailStudentLabel(student)}{student.is_primary ? " · Liên hệ chính" : ""}</span></li>)}</ul></div>
    </div>
  );
}
