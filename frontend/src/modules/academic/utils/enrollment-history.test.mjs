import test from "node:test";
import assert from "node:assert/strict";

import * as enrollmentHistory from "./enrollment-history.ts";

const {
  enrollmentEventLabel,
  enrollmentHistorySummary,
  enrollmentUpdateChanges,
} = enrollmentHistory;

const period = {
  id: 17,
  class: {
    id: 3,
    code: "TOAN-7A",
    name: "Toán 7A",
    subjects: [{ id: 4, name: "Toán" }],
  },
};

test("labels every immutable enrollment event without exposing raw enum values", () => {
  assert.equal(enrollmentEventLabel(0), "Ghi danh");
  assert.equal(enrollmentEventLabel(1), "Cập nhật ghi danh");
  assert.equal(enrollmentEventLabel(2), "Nghỉ học");
  assert.equal(enrollmentEventLabel(3), "Chuyển lớp đi");
  assert.equal(enrollmentEventLabel(4), "Chuyển lớp đến");
  assert.equal(enrollmentEventLabel(5), "Kết thúc cùng lớp");
});

test("describes legacy periods separately and never treats their notes as events", () => {
  assert.equal(
    enrollmentHistorySummary({
      kind: "legacy_enrollment",
      id: 9,
      effective_on: "2026-08-01",
      note: "[Nghỉ học]: Ghi chú cũ",
      enrollment: {
        ...period,
        enrolled_at: "2026-02-01",
        left_at: "2026-08-01",
        note: "[Nghỉ học]: Ghi chú cũ",
      },
      actor: null,
    }),
    "Lịch sử ghi danh cũ · không có nhật ký chi tiết",
  );

  assert.equal(
    enrollmentHistorySummary({
      kind: "event",
      id: 42,
      event_type: 3,
      effective_on: "2026-09-22",
      note: "Chuyển sang lớp TOAN-8A.",
      metadata: {},
      created_at: "2026-09-22T09:15:00+00:00",
      enrollment: period,
      related_enrollment: null,
      actor: null,
    }),
    "Chuyển lớp đi",
  );
});

test("orders transfer counterpart classes from source to destination", () => {
  const destination = {
    id: 8,
    code: "TOAN-7B",
    name: "Toán 7B",
    subjects: [{ id: 4, name: "Toán" }],
  };
  const source = {
    id: 7,
    code: "TOAN-7A",
    name: "Toán 7A",
    subjects: [{ id: 4, name: "Toán" }],
  };

  assert.deepEqual(
    enrollmentHistory.enrollmentHistoryClassPath({
      kind: "event",
      id: 42,
      event_type: 3,
      effective_on: "2026-09-22",
      note: null,
      metadata: {},
      created_at: "2026-09-22T09:15:00+00:00",
      enrollment: { id: 17, class: source },
      related_enrollment: { id: 18, class: destination },
      actor: null,
    }),
    [source, destination],
  );
  assert.deepEqual(
    enrollmentHistory.enrollmentHistoryClassPath({
      kind: "event",
      id: 43,
      event_type: 4,
      effective_on: "2026-09-22",
      note: null,
      metadata: {},
      created_at: "2026-09-22T09:15:00+00:00",
      enrollment: { id: 18, class: destination },
      related_enrollment: { id: 17, class: source },
      actor: null,
    }),
    [source, destination],
  );
});

test("keeps a legacy note from inventing a counterpart class", () => {
  assert.deepEqual(
    enrollmentHistory.enrollmentHistoryClassPath({
      kind: "legacy_enrollment",
      id: 19,
      effective_on: "2026-09-22",
      note: "[Chuyển sang lớp TOAN-7B]",
      enrollment: {
        ...period,
        enrolled_at: "2026-02-01",
        left_at: "2026-09-22",
        note: "[Chuyển sang lớp TOAN-7B]",
      },
      actor: null,
    }),
    [period.class],
  );
});

test("formats only fields that actually changed in an update event", () => {
  const event = {
    kind: "event",
    id: 42,
    event_type: 1,
    effective_on: "2026-09-22",
    note: "Cập nhật thông tin ghi danh.",
    metadata: {
      before: { enrolled_at: "2026-02-01", left_at: null, note: "Ghi chú cũ" },
      after: { enrolled_at: "2026-02-03", left_at: "2026-08-01", note: "Ghi chú mới" },
    },
    created_at: "2026-09-22T09:15:00+00:00",
    enrollment: period,
    related_enrollment: null,
    actor: { id: 1, username: "admin" },
  };

  assert.deepEqual(enrollmentUpdateChanges(event), [
    { field: "enrolled_at", before: "2026-02-01", after: "2026-02-03" },
    { field: "left_at", before: null, after: "2026-08-01" },
    { field: "note", before: "Ghi chú cũ", after: "Ghi chú mới" },
  ]);
  assert.deepEqual(enrollmentUpdateChanges({ ...event, event_type: 0, metadata: {} }), []);
});
