import test from "node:test";
import assert from "node:assert/strict";

import { classCreateSchema } from "./academic-form-schema.ts";

const fields = {
  name: "Lớp 0A",
  code: "ZERO-A",
  subject_id: 1,
  subject_ids: [1],
  teacher_id: 2,
  assistant_teacher_ids: [],
  max_students: 20,
  start_at: "2026-09-25",
  end_at: "",
};

test("creating a class requires an explicit grade, including when grade zero is available", () => {
  const empty = classCreateSchema.safeParse(fields);
  assert.equal(empty.success, false);
  assert.equal(empty.error?.issues.find((issue) => issue.path[0] === "grade_level")?.message, "Vui lòng chọn khối.");
  assert.equal(classCreateSchema.safeParse({ ...fields, grade_level: 0 }).success, true);
});
