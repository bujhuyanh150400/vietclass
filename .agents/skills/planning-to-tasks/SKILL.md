---
name: planning-to-tasks
description: Decomposes an approved implementation plan or scoped technical specification into executable, resumable work. Use before coding when work needs phase boundaries, task checklists, verification gates, and persistent progress tracking.
compatibility: Designed for Codex, Claude Code, and Agent Skills-compatible coding agents with repository file access.
metadata:
  version: "1.1.0"
  category: "agent-workflow"
  workflow-stage: "planning"
  artifact-type: "task-ledger"
  artifact-path: ".tasks/*.md"
  companion-skill: "executing-task-phases"
  state-model: "phase-task-checklist-gate"
  author: "AnhBH"
---


# Planning to Tasks

## Overview

Convert an approved implementation plan into a persistent execution document under `.tasks/`.

The task document is the execution contract and progress ledger. It must be detailed enough that another agent can resume work without relying on conversation history.

**Core principle:**

> Plan describes what should be built.  
> `.tasks/*.md` records how work will be executed and where execution currently stands.

Do not implement code while using this skill.

---

## When to Use

Use this skill when:

- an implementation plan already exists;
- a specification has already been approved and is concrete enough to implement;
- work contains multiple steps or components;
- execution may span a long session or multiple sessions;
- Codex, Claude Code, or another coding agent may resume the work later;
- context compaction or agent handoff could cause progress to be forgotten.

Do not use this skill to brainstorm requirements or design an unclear feature.

If the source plan contains unresolved implementation-critical ambiguity, stop and surface the ambiguity before generating tasks.

---

## Output Location

Create exactly one task file for the work:

```text
.tasks/<feature-name>.md
```

Examples:

```text
.tasks/auth-refactor.md
.tasks/student-import.md
.tasks/payment-webhooks.md
```

Use a short, lowercase, kebab-case feature name.

Create `.tasks/` if it does not exist.

---

## Source of Truth

After creation, the `.tasks/<feature-name>.md` file becomes the source of truth for execution progress.

The executor must not infer progress from:

- chat history;
- previous summaries;
- internal memory;
- stale todos;
- assumptions about what another agent probably completed.

Progress is represented only by the task file plus repository evidence such as tests, files, and Git history.

---

## Decomposition Model

Use exactly three levels:

```text
Phase
  └── Task
       └── Checklist Step
```

### Phase

A phase is a meaningful implementation milestone.

A phase should:

- group tightly related tasks;
- produce a reviewable intermediate state;
- have a clear verification gate;
- normally depend on the previous phase unless explicitly marked parallel-safe.

Good examples:

```text
Phase 1 — Domain foundations
Phase 2 — Application service
Phase 3 — HTTP integration
Phase 4 — Regression verification
```

Bad examples:

```text
Phase 1 — Create files
Phase 2 — Write code
Phase 3 — Test code
```

### Task

A task is the smallest implementation unit worth independently verifying or reviewing.

A task should normally:

- have one clear deliverable;
- touch a bounded set of files;
- include its own verification;
- be completable without interpreting unrelated tasks.

Do not create a separate task for every mechanical action.

Bad:

```text
Task 1 — Create file
Task 2 — Add class
Task 3 — Run test
Task 4 — Commit
```

Good:

```text
Task 1.2 — Add RefreshTokenService
```

with checklist steps for test, implementation, verification, and commit if required.

### Checklist Step

Checklist steps are concrete execution actions.

Prefer steps such as:

```markdown
- [ ] Add failing test for expired refresh tokens
- [ ] Run targeted test and confirm expected failure
- [ ] Implement refresh token expiry validation
- [ ] Run targeted test and confirm pass
- [ ] Run authentication regression suite
```

Avoid vague steps:

```markdown
- [ ] Handle errors
- [ ] Test everything
- [ ] Clean up code
```

---

## Phase Sizing

Prefer 2–6 tasks per phase.

Split a phase when:

- it spans unrelated modules;
- it cannot be verified with a coherent gate;
- it would require the executor to hold too much unrelated context;
- failure halfway through would leave an unclear recovery point.

Do not create artificial phases only to satisfy a number.

---

## Dependency Analysis

Before writing phases:

1. identify files/modules affected;
2. identify interfaces that later work depends on;
3. identify migrations/schema changes;
4. identify external integrations;
5. identify test boundaries;
6. order tasks so dependencies flow forward.

If tasks can safely run independently, mark them explicitly:

```markdown
Parallel-safe: YES
```

Otherwise:

```markdown
Parallel-safe: NO
```

Default to `NO`.

Never mark tasks parallel-safe when they modify overlapping files or depend on mutable output from one another.

---

## Required Document Header

Every task document MUST begin with:

```markdown
# <Feature Name> Tasks

Source Plan: `<path-to-plan>`
Status: PENDING
Current Phase: Phase 1
Current Task: —
Last Updated: YYYY-MM-DD

## Goal

<one concise implementation goal>

## Execution Rules

- Execute phases sequentially unless explicitly marked parallel-safe.
- Never enter the next phase before the current Phase Gate is PASSED.
- Update this file immediately after meaningful progress.
- Never batch progress updates until the end of the session.
- Never infer progress from conversation memory.
- On resume, verify repository evidence before trusting completed state.
- Stop on unresolved implementation-critical ambiguity or blocker.
```

If there is no source plan file, use:

```markdown
Source Plan: inline approved specification
```

---

## Timeline

Every task document MUST contain a timeline directly after the header.

Template:

```markdown
## Timeline

- [ ] Phase 1 — <name>
- [ ] Phase 2 — <name>
- [ ] Phase 3 — <name>

Progress: 0 / 3 phases
```

Markers:

```text
[ ] pending
[>] in progress
[x] complete
[!] blocked
```

Only one phase may normally be `[>]` at a time.

---

## Task Template

Use this structure for every task:

```markdown
## Task 2.3 — <Task name>

Status: PENDING
Parallel-safe: NO

### Outcome

<observable result produced by this task>

### Files

- Create: `path/to/file`
- Modify: `path/to/file`
- Test: `path/to/test`

### Dependencies

- Task 2.1
- `SomeInterface.method(input): Output`

### Checklist

- [ ] <concrete step>
- [ ] <concrete step>
- [ ] <verification step>

### Verification

Run:

```bash
<exact command>
```

Expected:

```text
<observable success condition>
```

### Completion Evidence

- Tests:
- Commit:
- Notes:
```

Remove unused `Create`, `Modify`, or `Test` lines rather than leaving placeholders.

---

## Phase Gate

Every phase MUST end with a hard gate.

Template:

```markdown
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
```

Allowed gate states:

```text
PENDING
PASSED
FAILED
```

A later phase MUST NOT start unless the previous phase says:

```text
Gate Status: PASSED
```

---

## Status Model

Use only these task/phase states:

```text
PENDING
IN_PROGRESS
BLOCKED
COMPLETE
```

Use only these gate states:

```text
PENDING
PASSED
FAILED
```

Do not invent additional states unless the human explicitly requests them.

---

## Verification Requirements

Every task must have an observable verification strategy.

Prefer, in order:

1. targeted automated test;
2. integration test;
3. typecheck / static analysis;
4. lint;
5. build;
6. deterministic manual verification when automation is unavailable.

Do not write:

```text
Verify it works.
```

Write the exact command and expected result whenever possible.

If the plan does not provide exact commands, inspect the repository instructions and existing scripts before choosing them.

---

## Progress Recovery Design

Design the task file so execution can recover after context loss.

A new executor should be able to determine:

```text
1. What is the overall goal?
2. Which phase is active?
3. Which task is active?
4. What is already complete?
5. What verification has passed?
6. What remains?
7. Is anything blocked?
```

If the document cannot answer all seven questions, improve it before finishing.

---

## Self-Review

Before declaring the task file ready:

### Coverage

- [ ] Every implementation requirement maps to at least one task.
- [ ] No task introduces unrelated scope.
- [ ] Dependencies are ordered correctly.

### Executability

- [ ] Every task has a concrete outcome.
- [ ] Every task contains actionable checklist steps.
- [ ] Every task has verification.
- [ ] File paths are explicit where known.

### Recovery

- [ ] Timeline exists.
- [ ] Current Phase exists.
- [ ] Current Task exists.
- [ ] Every phase has a gate.
- [ ] Status values use the defined model only.

### Ambiguity

Search for and resolve:

```text
TBD
TODO
later
as needed
appropriate
similar to
handle edge cases
test everything
```

These phrases usually indicate the executor would need to redesign the plan while implementing it.

---

## Final Response

After creating the task file, report only:

```text
Task breakdown created: .tasks/<feature-name>.md
Phases: <N>
Tasks: <N>
Ready for execution with executing-task-phases.
```
