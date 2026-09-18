import test from "node:test";
import assert from "node:assert/strict";

import { buildSubjectListParams } from "./subject-list-controls.ts";

test("maps ascending class-count sorting to the API contract", () => {
  assert.deepEqual(
    buildSubjectListParams({ gradeLevel: null, isActive: null, sort: "classes-asc" }),
    { sort: "active_classes_count", direction: "asc" },
  );
});
