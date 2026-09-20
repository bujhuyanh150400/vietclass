---
description: Multi-agent routing, delegation, review, and escalation policy for Pi subagents.
alwaysApply: true
metadata:
  scope: global
  paths:
    - "**/*"
---

# Multi-Agent Orchestration

## Parent Responsibility

The parent agent remains the final decision-maker.

Use subagents to reduce parent context usage, isolate bounded work, or obtain an independent review. Do not delegate merely because a subagent exists.

All subagents must follow the repository rules and source-of-truth documents applicable to their task.

## Task Routing

### Direct Work

Handle trivial and obvious work directly when delegation overhead would exceed the task.

Examples:

- typo or copy changes
- obvious one-line fixes
- small configuration changes with a known location
- simple questions that require only a few file reads

### Scout

Use `scout` when the relevant implementation is not yet understood.

Typical uses:

- locate entry points
- identify relevant files and symbols
- trace data or execution flow
- map dependencies between modules
- determine where another agent should begin

Scout is reconnaissance, not implementation.

Do not run scout when the relevant files and flow are already known.

### Researcher

Use `researcher` only when external evidence is required.

Typical uses:

- official framework or library documentation
- changed or version-dependent APIs
- external specifications
- recent technical behavior
- facts that cannot be established from repository evidence

Prefer repository evidence when it is sufficient.

### Worker

Use `worker` for bounded implementation work.

Typical uses:

- feature implementation
- bug fixes
- refactoring within an approved boundary
- tests
- debugging
- type, lint, build, or runtime failures

Give the worker:

- the requested outcome
- the implementation boundary
- relevant findings from scout or researcher
- explicit success criteria
- required verification

Keep one implementation writer responsible for a given set of files.

### Reviewer

Use `reviewer` as an independent check after substantial implementation.

Review against:

- the original requested outcome
- applicable repository rules
- changed behavior
- tests and verification evidence
- edge cases and regressions
- unnecessary complexity
- unintended scope expansion

Prefer a fresh reviewer context so review is independent from the implementation trajectory.

If the reviewer finds significant issues, return the bounded fixes to `worker`, then verify again.

Do not require a separate reviewer for trivial changes unless the risk warrants it.

### Oracle

`oracle` is an escalation mechanism, not a routine review step.

Use it only when normal repository investigation, implementation, testing, and review leave a meaningful unresolved question, such as:

- an architectural boundary with long-term consequences
- a security-sensitive design decision
- conflicting implementation approaches with material tradeoffs
- unresolved correctness or invariant concerns
- disagreement between worker and reviewer
- repeated failed fixes where the root cause remains unclear
- a foundational refactor that requires a second opinion

Oracle provides advice only.

The parent must evaluate the advice and approve the direction before implementation continues.

## Preferred Workflows

### Trivial task

parent -> direct work -> verification

### Normal implementation

parent -> worker -> parent verification

### Unfamiliar implementation

parent -> scout -> worker -> reviewer -> parent verification

### External-information-dependent implementation

parent -> researcher -> worker -> reviewer -> parent verification

### Difficult or risky decision

parent
-> scout/researcher as needed
-> ordinary analysis/review
-> oracle only if uncertainty remains
-> parent approves direction
-> worker
-> reviewer
-> parent verification

## Parallelism

Parallelize independent read-only investigation when useful.

Good examples:

- scout backend + scout frontend
- scout local implementation + researcher external documentation
- independent read-only investigations of separate modules

Do not allow concurrent agents to edit overlapping files.

Prefer a single writer for implementation changes.

## Context Discipline

Keep delegated tasks bounded.

Give subagents only the context necessary to complete their assignment. Prefer findings and precise file references over copying large amounts of repository content into prompts.

The parent should integrate subagent results rather than blindly forwarding one agent's conclusion to another.

## Cost Discipline

Model selection is configured in `.pi/settings.json`; do not override configured models per run without a concrete reason.

Prefer the cheapest configured role capable of completing the bounded task.

In particular:

- do not scout code that is already understood
- do not research external sources when repository evidence is sufficient
- do not review trivial changes by default
- do not invoke oracle routinely
- do not create multi-agent chains for simple tasks

Escalation should be evidence-driven, not automatic.
