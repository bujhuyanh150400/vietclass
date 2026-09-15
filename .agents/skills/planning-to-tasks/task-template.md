# Feature Name Tasks

Source Plan: `docs/plans/example.md`
Status: PENDING
Current Phase: Phase 1
Current Task: —
Last Updated: YYYY-MM-DD

## Goal

Describe the implementation goal in one sentence.

## Execution Rules

- Execute phases sequentially unless explicitly marked parallel-safe.
- Never enter the next phase before the current Phase Gate is PASSED.
- Update this file immediately after meaningful progress.
- Never batch progress updates until the end of the session.
- Never infer progress from conversation memory.
- On resume, verify repository evidence before trusting completed state.
- Stop on unresolved implementation-critical ambiguity or blocker.

---

## Timeline

- [ ] Phase 1 — Foundation
- [ ] Phase 2 — Integration
- [ ] Phase 3 — Verification

Progress: 0 / 3 phases

---

# Phase 1 — Foundation

Status: PENDING

## Task 1.1 — Example foundation task

Status: PENDING
Parallel-safe: NO

### Outcome

Describe the observable result.

### Files

- Create: `path/to/new-file`
- Modify: `path/to/existing-file`
- Test: `tests/path/to/test`

### Dependencies

- None

### Checklist

- [ ] Add failing test for the required behavior
- [ ] Run targeted test and confirm expected failure
- [ ] Implement the minimum required behavior
- [ ] Run targeted test and confirm pass
- [ ] Run affected regression tests

### Verification

Run:

```bash
<exact command>
```

Expected:

```text
PASS
```

### Completion Evidence

- Tests:
- Commit:
- Notes:

---

## Phase Gate

### Completion

- [ ] All phase tasks are COMPLETE
- [ ] No task remains IN_PROGRESS
- [ ] No unresolved BLOCKED task

### Verification

- [ ] Required targeted tests pass
- [ ] Required broader tests pass
- [ ] Linter/typecheck passes where applicable
- [ ] Git diff reviewed
- [ ] No accidental files changed

### Progress

- [ ] Timeline updated
- [ ] Current Phase updated
- [ ] Current Task updated

Gate Status: PENDING

---

# Phase 2 — Integration

Status: PENDING

## Task 2.1 — Example integration task

Status: PENDING
Parallel-safe: NO

### Outcome

Describe the observable result.

### Files

- Modify: `path/to/file`
- Test: `tests/path/to/test`

### Dependencies

- Task 1.1

### Checklist

- [ ] Add or update integration test
- [ ] Confirm expected failure before implementation
- [ ] Implement integration
- [ ] Run targeted integration test
- [ ] Run affected regression suite

### Verification

Run:

```bash
<exact command>
```

Expected:

```text
PASS
```

### Completion Evidence

- Tests:
- Commit:
- Notes:

---

## Phase Gate

### Completion

- [ ] All phase tasks are COMPLETE
- [ ] No task remains IN_PROGRESS
- [ ] No unresolved BLOCKED task

### Verification

- [ ] Required targeted tests pass
- [ ] Required broader tests pass
- [ ] Linter/typecheck passes where applicable
- [ ] Git diff reviewed
- [ ] No accidental files changed

### Progress

- [ ] Timeline updated
- [ ] Current Phase updated
- [ ] Current Task updated

Gate Status: PENDING

---

# Phase 3 — Verification

Status: PENDING

## Task 3.1 — Final regression verification

Status: PENDING
Parallel-safe: NO

### Outcome

All affected behavior is verified and the implementation is ready for review.

### Files

- Modify: only if verification reveals required fixes

### Dependencies

- Phase 1 Gate: PASSED
- Phase 2 Gate: PASSED

### Checklist

- [ ] Run complete affected test suite
- [ ] Run lint/typecheck/build required by repository instructions
- [ ] Review final Git diff
- [ ] Confirm no unrelated changes
- [ ] Record final completion evidence

### Verification

Run:

```bash
<repository verification commands>
```

Expected:

```text
All required checks pass.
```

### Completion Evidence

- Tests:
- Commit:
- Notes:

---

## Phase Gate

### Completion

- [ ] All phase tasks are COMPLETE
- [ ] No task remains IN_PROGRESS
- [ ] No unresolved BLOCKED task

### Verification

- [ ] Required targeted tests pass
- [ ] Required broader tests pass
- [ ] Linter/typecheck passes where applicable
- [ ] Git diff reviewed
- [ ] No accidental files changed

### Progress

- [ ] Timeline updated
- [ ] Current Phase updated
- [ ] Current Task updated

Gate Status: PENDING
