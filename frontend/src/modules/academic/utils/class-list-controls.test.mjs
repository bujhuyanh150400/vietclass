import test from "node:test";
import assert from "node:assert/strict";

import {
  activeClassFilterCount,
  buildClassListParams,
  hasClassConditions,
  resolveClassPageSize,
} from "./class-list-controls.ts";

test("maps the class-list filters and selected sort to the API query", () => {
  assert.deepEqual(
    buildClassListParams({ status: 0, gradeLevel: 8, sort: "name-asc" }),
    { "status[0]": 0, "grade_level[0]": 8, sort: "name", direction: "asc" },
  );
});

test("maps each class-list sort choice to supported API columns", () => {
  assert.deepEqual(
    ["created-desc", "name-asc", "name-desc", "start-near"].map((sort) =>
      buildClassListParams({ status: null, gradeLevel: null, sort }).sort,
    ),
    ["created_at", "name", "name", "start_at"],
  );
});

test("counts the active filter groups and recognizes removable conditions", () => {
  assert.equal(activeClassFilterCount(null, null), 0);
  assert.equal(activeClassFilterCount(1, null), 1);
  assert.equal(activeClassFilterCount(1, 8), 2);

  assert.equal(hasClassConditions({ search: "", status: null, gradeLevel: null, sort: "created-desc" }), false);
  assert.equal(hasClassConditions({ search: "Toán", status: null, gradeLevel: null, sort: "created-desc" }), true);
  assert.equal(hasClassConditions({ search: "", status: 0, gradeLevel: null, sort: "created-desc" }), true);
  assert.equal(hasClassConditions({ search: "", status: null, gradeLevel: 8, sort: "created-desc" }), true);
  assert.equal(hasClassConditions({ search: "", status: null, gradeLevel: null, sort: "name-asc" }), true);
});

test("keeps card pages at twenty and validates the table page size", () => {
  assert.equal(resolveClassPageSize("grid", 50), 20);
  assert.equal(resolveClassPageSize("table", 20), 20);
  assert.equal(resolveClassPageSize("table", 500), 10);
});
