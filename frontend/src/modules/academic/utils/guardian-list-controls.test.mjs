import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGuardianListParams,
  guardianCanMutate,
  buildGuardianStudentFetchPlan,
  buildGuardianUpdatePayload,
  GENDER_LABELS,
  GUARDIAN_OPTION_LIMIT,
  guardianDeleteRequirementsMet,
  guardianDetailProfileFacts,
  guardianDetailStudentLabel,
  guardianReplacementChoices,
  guardianReplacementRequirementsMet,
  resetGuardianListControls,
  toggleGuardianStudent,
} from "./guardian-list-controls.mjs";

test("guardian mutations stay denied for Teachers even when their feature grants say yes", () => {
  assert.equal(guardianCanMutate(1, true), false);
  assert.equal(guardianCanMutate(1, false), false);
  assert.equal(guardianCanMutate(0, true), true);
  assert.equal(guardianCanMutate(0, false), false);
});

test("guardian controls preserve search, view, sort, filters, and reset page on condition changes", () => {
  assert.deepEqual(
    buildGuardianListParams({ q: " Hà ", page: 3, perPage: 20, sort: "name-asc" }),
    { q: "Hà", page: 3, per_page: 20, sort: "full_name", direction: "asc" },
  );
  assert.deepEqual(resetGuardianListControls({ q: "x", page: 4, sort: "name-desc" }), {
    q: "",
    page: 1,
    sort: "newest",
  });
});

test("guardian form changes one student relationship and primary flag independently", () => {
  const roster = [
    { student_profile_id: 1, relationship: 0, is_primary: true },
    { student_profile_id: 2, relationship: 1, is_primary: false },
  ];

  assert.deepEqual(toggleGuardianStudent(roster, 2, { relationship: 2 }), [
    { student_profile_id: 1, relationship: 0, is_primary: true },
    { student_profile_id: 2, relationship: 2, is_primary: false },
  ]);
  assert.deepEqual(toggleGuardianStudent(roster, 2, { is_primary: true }), [
    { student_profile_id: 1, relationship: 0, is_primary: true },
    { student_profile_id: 2, relationship: 1, is_primary: true },
  ]);
});

test("guardian replacement controls fetch every linked student and require each replacement", () => {
  const linkedIds = Array.from({ length: 201 }, (_, index) => index + 1);
  assert.deepEqual(buildGuardianStudentFetchPlan(linkedIds), linkedIds);
  assert.equal(
    guardianReplacementRequirementsMet(
      10,
      [1],
      [{ id: 1, guardians: [{ profile_id: 10, is_primary: true }, { profile_id: 11, is_primary: false }] }],
      [{ student_profile_id: 1, relationship: 0, is_primary: false }],
      {},
    ),
    false,
  );
  assert.equal(
    guardianReplacementRequirementsMet(
      10,
      [1],
      [{ id: 1, guardians: [{ profile_id: 10, is_primary: true }, { profile_id: 11, is_primary: false }] }],
      [{ student_profile_id: 1, relationship: 0, is_primary: false }],
      { 1: 11 },
    ),
    true,
  );
  assert.equal(
    guardianDeleteRequirementsMet(
      10,
      [1],
      [{ id: 1, guardians: [{ profile_id: 10, is_primary: true }, { profile_id: 11, is_primary: false }] }],
      { 1: 11 },
    ),
    true,
  );
});

test("guardian detail labels include gender, contact fields, grade, and relationship", () => {
  assert.deepEqual(guardianDetailProfileFacts({ phone: "0900", email: null, gender: 2, address: "Huế", note: "Gọi buổi tối" }), [
    { label: "Số điện thoại", value: "0900" },
    { label: "Email", value: "—" },
    { label: "Giới tính", value: "Khác" },
    { label: "Địa chỉ", value: "Huế" },
    { label: "Ghi chú", value: "Gọi buổi tối" },
  ]);
  assert.equal(guardianDetailStudentLabel({ grade_level: 6, relationship: 1 }), "Lớp 6 · Mẹ");
});

test("guardian mutation helpers cap options, preserve explicit replacements, and expose enum labels", () => {
  assert.equal(GUARDIAN_OPTION_LIMIT, 50);
  assert.deepEqual(GENDER_LABELS, { 0: "Nam", 1: "Nữ", 2: "Khác" });
  assert.deepEqual(
    buildGuardianUpdatePayload({
      students: [
        { student_profile_id: 7, relationship: 0, is_primary: false },
        { student_profile_id: 8, relationship: 1, is_primary: true },
      ],
      replacements: { 7: 12, 8: 99 },
    }),
    {
      students: [
        { student_profile_id: 7, relationship: 0, is_primary: false },
        { student_profile_id: 8, relationship: 1, is_primary: true },
      ],
      replacements: { 7: 12 },
    },
  );
  assert.deepEqual(
    guardianReplacementChoices(
      { guardians: [
        { profile_id: 3, full_name: "A", phone: null, relationship: 0, is_primary: true },
        { profile_id: 4, full_name: "B", phone: null, relationship: 1, is_primary: false },
      ] },
      3,
    ),
    [{ profile_id: 4, full_name: "B", phone: null, relationship: 1, is_primary: false }],
  );
});
