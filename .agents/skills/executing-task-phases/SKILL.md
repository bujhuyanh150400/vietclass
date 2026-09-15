---
name: executing-task-phases
description: Executes implementation work already tracked in a .tasks Markdown ledger. Use when coding must proceed phase-by-phase with checklist updates, verification gates, resumable state, and protection against lost progress after context compaction or agent handoff.
compatibility: Designed for Codex, Claude Code, and Agent Skills-compatible coding agents with repository file access and command execution.
metadata:
  version: "1.1.0"
  category: "agent-workflow"
  workflow-stage: "execution"
  artifact-type: "task-ledger"
  artifact-path: ".tasks/*.md"
  companion-skill: "planning-to-tasks"
  state-model: "phase-task-checklist-gate"
---


# Executing Task Phases

## Overview

Execute a `.tasks/*.md` task ledger phase-by-phase while keeping repository state and task-file progress synchronized.

**Core principle:**

> The task file is persistent execution state.  
> Never rely on conversation memory to know what has or has not been completed.

Do not redesign the feature while using this skill unless execution proves the plan is invalid.

---

## Required Input

This skill requires one task file:

```text
.tasks/<feature-name>.md
```

If multiple task files exist and the intended one is not obvious, use the task file explicitly named by the human or active project instructions.

---

## Source of Truth

Use this priority order:

```text
1. Human instructions
2. Repository instructions
3. .tasks/<feature-name>.md
4. Repository evidence: tests, Git history, files
5. Conversation memory
```

Conversation memory is never sufficient evidence that a task is complete.

---

## Startup / Resume Protocol

At the beginning of every execution session:

1. Read the entire task-file header.
2. Read `Timeline`.
3. Read `Current Phase`.
4. Read `Current Task`.
5. Locate the first unfinished checklist item.
6. Inspect repository evidence for already-marked completed work.
7. Check Git status before modifying files.
8. Resume from the first incomplete, valid execution point.

Do not restart completed phases.

Do not blindly trust stale checkboxes when repository evidence contradicts them.

If the task file says something is COMPLETE but required code/tests are absent:

```text
Status: BLOCKED
```

Record the mismatch in `Completion Evidence` or notes and stop before advancing.

---

## Execution State Machine

Use this state machine:

```text
PENDING
  ↓
IN_PROGRESS
  ↓
implement checklist
  ↓
verify
  ├─ success → COMPLETE
  └─ failure → fix or BLOCKED
```

For phases:

```text
Phase IN_PROGRESS
     ↓
all tasks COMPLETE
     ↓
Phase Gate verification
     ├─ PASS → Gate PASSED → Phase COMPLETE
     └─ FAIL → Gate FAILED → stop advancement
```

Never skip a state transition.

---

## Before Starting a Task

Update the task file immediately:

```markdown
Status: IN_PROGRESS
Current Phase: Phase N
Current Task: Task N.M
```

Update Timeline:

```markdown
- [>] Phase N — <name>
```

Do this before implementation, not after.

---

## Task Execution Loop

For each task:

### 1. Read task scope

Read:

- Outcome
- Files
- Dependencies
- Checklist
- Verification
- Completion Evidence

Confirm dependencies are satisfied.

If a dependency is incomplete, do not work around it.

Mark the task `BLOCKED` and record the dependency.

### 2. Inspect before edit

Before changing code:

- read relevant repository instructions;
- inspect files listed by the task;
- inspect nearby patterns only as needed;
- avoid broad repo exploration unrelated to the task.

Do not expand scope because nearby code could be improved.

### 3. Execute one checklist item at a time

Follow the task checklist in order unless the task itself explicitly permits reordering.

After completing a meaningful checklist item:

```markdown
- [x] completed step
```

Persist the update immediately.

Do not wait until all tasks are finished.

### 4. Run verification

Run the exact verification command written in the task.

If implementation changed the repository in a way that requires additional mandatory checks from repository instructions, run those too.

A task cannot become COMPLETE without successful verification.

### 5. Record evidence

Update:

```markdown
### Completion Evidence

- Tests: `<command>` — PASS
- Commit: `<sha or "not committed">`
- Notes: <important implementation note or "None">
```

Do not write PASS unless the command was actually run successfully.

### 6. Complete task

Only after verification succeeds:

```markdown
Status: COMPLETE
```

Then move `Current Task` to the next incomplete task.

---

## Verification Discipline

Never substitute confidence for verification.

These are invalid completion claims:

```text
should work
looks correct
probably passes
tests were already green
no reason this would fail
```

Required:

```text
command executed
exit/result observed
result recorded
```

If verification cannot be run because of environment limitations:

1. mark the task `BLOCKED`;
2. record the exact missing dependency or environment issue;
3. do not mark it COMPLETE;
4. do not advance the Phase Gate.

---

## Phase Gate Protocol

After every task in the phase is COMPLETE, return to the phase's `Phase Gate`.

Evaluate every checkbox.

### Completion checks

Confirm:

- all phase tasks say COMPLETE;
- no task says IN_PROGRESS;
- no task says BLOCKED.

### Verification checks

Run required phase-level checks.

Typical checks:

```text
targeted test suite
broader regression suite
lint
typecheck
build
git diff
git status
```

Use repository-specific commands from project instructions or the task file.

### Git diff review

Before passing the gate:

```bash
git status --short
git diff --stat
git diff
```

Equivalent commands are acceptable.

Check for:

- accidental generated files;
- secrets;
- unrelated edits;
- debug code;
- temporary logging;
- changes outside task scope.

### Gate result

If all checks pass:

```markdown
Gate Status: PASSED
```

Then:

```markdown
Status: COMPLETE
```

for the phase.

Update Timeline:

```markdown
- [x] Phase N — <name>
```

Update progress count.

Only then begin Phase N+1.

If any required gate item fails:

```markdown
Gate Status: FAILED
```

Do not advance.

---

## Hard Gate

This rule is mandatory:

```text
NEVER enter Phase N+1 unless Phase N has:

Gate Status: PASSED
```

No exceptions for:

- "small remaining issue";
- "tests will be fixed later";
- "independent-looking next phase";
- context pressure;
- token pressure;
- time pressure.

If later work is explicitly marked parallel-safe by the task file, it may execute independently only when its declared dependencies are satisfied.

Parallel-safe does not bypass a required dependency.

---

## Blockers

Use `BLOCKED` when execution cannot continue safely.

Examples:

- missing environment variable;
- unavailable service;
- migration prerequisite missing;
- contradictory plan requirement;
- required test cannot execute;
- dependency task failed;
- implementation reveals a fundamental plan error.

When blocked:

```markdown
Status: BLOCKED
```

and record:

```markdown
### Blocker

Reason:
Evidence:
Required resolution:
```

Do not guess through a blocker.

Do not start unrelated later phases to appear productive.

---

## Plan Defects Discovered During Execution

A task ledger is not infallible.

If execution reveals that the task plan is technically invalid:

1. stop the affected task;
2. mark it `BLOCKED`;
3. record concrete evidence;
4. identify the smallest required plan correction;
5. surface the issue to the human.

Do not silently rewrite architectural intent.

Mechanical corrections that do not change behavior or scope, such as correcting an obviously stale file path after a repository rename, may be updated directly if repository evidence is unambiguous. Record the correction in Notes.

---

## Scope Control

Only change files required by:

- the active task;
- mandatory test support;
- mandatory build/lint fixes caused by the active task.

Do not:

- refactor neighboring modules "while here";
- upgrade dependencies without requirement;
- rename unrelated APIs;
- clean unrelated lint warnings;
- rewrite tests outside affected behavior.

If unrelated problems are discovered, record them in Notes instead of expanding scope.

---

## Timeline Update Rules

The task file must always reflect the current state.

At minimum update it when:

```text
task starts
checklist milestone completes
task blocks
task completes
phase gate starts
phase gate passes/fails
next phase begins
```

Never batch all timeline changes at session end.

---

## Resume After Context Compaction

After any suspected context loss:

1. ignore remembered progress;
2. reopen the `.tasks` file;
3. inspect `Current Phase`;
4. inspect `Current Task`;
5. inspect the latest Completion Evidence;
6. run `git status`;
7. inspect relevant Git history if needed;
8. resume only after state is reconstructed.

If memory and the task ledger disagree, use repository evidence to resolve the disagreement.

Never redispatch or redo completed work solely because the conversation no longer contains it.

---

## Optional Subagents

Subagents may be used for individual tasks when available.

Rules:

- give a subagent only the active task plus required project context;
- do not hand it the entire conversation;
- do not let multiple agents modify overlapping files in parallel;
- the parent executor remains responsible for updating `.tasks`;
- a subagent report does not replace verification.

For large tasks, fresh task-scoped context is preferred over carrying the full execution history.

---

## Completion

The overall task file is complete only when:

```text
all phases COMPLETE
all Phase Gates PASSED
no BLOCKED tasks remain
required final verification passes
Timeline shows every phase complete
```

Then update the header:

```markdown
Status: COMPLETE
Current Phase: COMPLETE
Current Task: —
```

Update Timeline progress:

```text
Progress: N / N phases
```

---

## Final Verification

Before declaring the work complete:

1. run final required tests;
2. run lint/typecheck/build required by repository instructions;
3. review final Git diff;
4. confirm no unresolved task notes are load-bearing;
5. confirm every phase gate is PASSED;
6. confirm the task ledger header says COMPLETE.

Never claim completion before these checks are observed.

---

## Final Response

Report:

```text
Execution complete: .tasks/<feature-name>.md

Phases: N/N complete
Tasks: N/N complete
Verification: PASS
Blockers: none
```

If blocked:

```text
Execution blocked: .tasks/<feature-name>.md

Phase: <phase>
Task: <task>
Reason: <concise blocker>
Required resolution: <what is needed>
```
