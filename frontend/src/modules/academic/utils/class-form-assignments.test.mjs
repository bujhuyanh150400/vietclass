import test from "node:test";
import assert from "node:assert/strict";

import {
  choosePrimaryClassSubject,
  classSubjectSetChanged,
  toggleAssistantTeacher,
  toggleClassSubject,
} from "./class-form-assignments.ts";

test("keeps one primary subject as selected subjects are toggled", () => {
  assert.deepEqual(toggleClassSubject([], 0, 8), { subjectIds: [8], primarySubjectId: 8 });
  assert.deepEqual(toggleClassSubject([4, 8], 4, 12), {
    subjectIds: [4, 8, 12],
    primarySubjectId: 4,
  });
  assert.deepEqual(toggleClassSubject([4, 8, 12], 4, 4), {
    subjectIds: [8, 12],
    primarySubjectId: 8,
  });
  assert.deepEqual(toggleClassSubject([4], 4, 4), { subjectIds: [], primarySubjectId: 0 });
});

test("only a selected subject can become primary", () => {
  assert.equal(choosePrimaryClassSubject([4, 8], 8), 8);
  assert.equal(choosePrimaryClassSubject([4, 8], 12), 4);
});

test("subject-set confirmation is required only when membership changes, not order or primary marker", () => {
  assert.equal(classSubjectSetChanged([2, 5], [5, 2]), false);
  assert.equal(classSubjectSetChanged([2, 5], [2, 5, 7]), true);
  assert.equal(classSubjectSetChanged([2, 5], [2]), true);
});

test("assistant selection stays unique and cannot collide with the lead", () => {
  assert.deepEqual(toggleAssistantTeacher([], 8, 4), [8]);
  assert.deepEqual(toggleAssistantTeacher([8], 4, 4), [8]);
  assert.deepEqual(toggleAssistantTeacher([8, 12], 8, 4), [12]);
});
