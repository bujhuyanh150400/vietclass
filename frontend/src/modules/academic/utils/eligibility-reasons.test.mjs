import test from "node:test";
import assert from "node:assert/strict";

import {
  enrollmentStudentDisabledReason,
  subjectDisabledReason,
  teacherDisabledReason,
  transferDisabledReason,
} from "./eligibility-reasons.ts";

test("explains every backend enrollment and transfer eligibility code", () => {
  assert.equal(enrollmentStudentDisabledReason("account_missing"), "Chưa có tài khoản đăng nhập.");
  assert.equal(enrollmentStudentDisabledReason("account_inactive"), "Tài khoản đang bị khóa.");
  assert.equal(enrollmentStudentDisabledReason("grade_mismatch"), "Không cùng khối với lớp.");
  assert.equal(enrollmentStudentDisabledReason("already_enrolled"), "Đang học trong lớp này.");
  assert.equal(enrollmentStudentDisabledReason("class_full"), "Lớp đã đủ sĩ số.");
  assert.equal(enrollmentStudentDisabledReason("class_ended"), "Lớp đã kết thúc.");

  assert.equal(transferDisabledReason("grade_mismatch"), "Không cùng khối với học sinh.");
  assert.equal(transferDisabledReason("subject_mismatch"), "Không trùng toàn bộ tập môn học.");
  assert.equal(transferDisabledReason("already_enrolled"), "Học sinh đang học trong lớp này.");
  assert.equal(transferDisabledReason("class_full"), "Lớp đã đủ sĩ số.");
  assert.equal(transferDisabledReason("class_ended"), "Lớp đã kết thúc.");
});

test("explains inactive and out-of-grade subjects while keeping valid ones selectable", () => {
  assert.equal(subjectDisabledReason(false, [9], 9), "Môn đã khóa.");
  assert.equal(subjectDisabledReason(true, [8, 10], 9), "Môn không áp dụng cho khối đã chọn.");
  assert.equal(subjectDisabledReason(true, [9], 9), null);
});

test("prevents inactive teachers and lead-assistant role collisions", () => {
  assert.equal(teacherDisabledReason(1, 5, 7), "Giáo viên đã nghỉ.");
  assert.equal(teacherDisabledReason(0, 7, 7), "Đang là giáo viên phụ trách.");
  assert.equal(teacherDisabledReason(0, 5, 7), null);
});
