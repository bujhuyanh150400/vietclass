import test from "node:test";
import assert from "node:assert/strict";

import * as studentClassHistory from "./student-class-history.ts";

test("labels current and past class memberships without confusing class status", () => {
  assert.equal(studentClassHistory.studentClassStatusLabel(true), "Đang học");
  assert.equal(studentClassHistory.studentClassStatusLabel(false), "Đã rời");
});

test("exposes history only to an administrator with student.view", () => {
  assert.equal(studentClassHistory.canViewStudentEnrollmentHistory(0, ["student.view"]), true);
  assert.equal(studentClassHistory.canViewStudentEnrollmentHistory(1, ["student.view"]), false);
  assert.equal(studentClassHistory.canViewStudentEnrollmentHistory(0, []), false);
});
