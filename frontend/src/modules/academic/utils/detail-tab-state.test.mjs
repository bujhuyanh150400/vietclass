import test from "node:test";
import assert from "node:assert/strict";

import {
  classDetailTab,
  classRosterTab,
  studentDetailTab,
} from "./detail-tab-state.ts";

test("class detail recognizes the four approved tabs and falls back to overview", () => {
  assert.equal(classDetailTab("overview"), "overview");
  assert.equal(classDetailTab("students"), "students");
  assert.equal(classDetailTab("schedule"), "schedule");
  assert.equal(classDetailTab("sessions"), "sessions");
  assert.equal(classDetailTab("unknown"), "overview");
  assert.equal(classDetailTab(null), "overview");
});

test("class roster sub-tab defaults safely to current students", () => {
  assert.equal(classRosterTab("current"), "current");
  assert.equal(classRosterTab("past"), "past");
  assert.equal(classRosterTab("history"), "current");
  assert.equal(classRosterTab(null), "current");
});

test("legacy student history tab URLs fall back to the classes tab", () => {
  assert.equal(studentDetailTab("profile"), "profile");
  assert.equal(studentDetailTab("classes"), "classes");
  assert.equal(studentDetailTab("rewards"), "rewards");
  assert.equal(studentDetailTab("reports"), "reports");
  assert.equal(studentDetailTab("history"), "classes");
  assert.equal(studentDetailTab("unknown"), "profile");
  assert.equal(studentDetailTab(null), "profile");
});
