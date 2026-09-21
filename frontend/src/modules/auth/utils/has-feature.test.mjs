import test from "node:test";
import assert from "node:assert/strict";

import { hasFeature } from "./has-feature.ts";

test("answers true only for a loaded identity that carries the requested feature", () => {
  assert.equal(hasFeature(["student.update"], "student.update"), true);
  assert.equal(hasFeature(["student.update"], "student.toggle_active"), false);
  assert.equal(hasFeature([], "student.update"), false);
  assert.equal(hasFeature(undefined, "student.update"), false);
});
