import test from "node:test";
import assert from "node:assert/strict";

import {
  canConfirmTeacherOffboarding,
  teacherOffboardingAssignments,
} from "./teacher-offboarding.ts";

test("offboarding requires replacements only for active lead classes", () => {
  const assignments = teacherOffboardingAssignments({
    id: 12,
    classes: [
      { id: 4, status: 0 },
      { id: 5, status: 1 },
      { id: 7, status: 0 },
    ],
    assistant_classes: [
      { id: 8, status: 0 },
      { id: 9, status: 1 },
    ],
  });

  assert.deepEqual(assignments.leadClassIds, [4, 7]);
  assert.deepEqual(assignments.assistantClassIds, [8]);
});

test("offboarding cannot confirm until every lead has a different active replacement", () => {
  assert.equal(canConfirmTeacherOffboarding([4, 7], { 4: 2 }, 12), false);
  assert.equal(canConfirmTeacherOffboarding([4, 7], { 4: 2, 7: 12 }, 12), false);
  assert.equal(canConfirmTeacherOffboarding([4, 7], { 4: 2, 7: 3 }, 12), true);
  assert.equal(canConfirmTeacherOffboarding([], {}, 12), true);
});
