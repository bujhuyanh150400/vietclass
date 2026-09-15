---
name: issue-writing
description: Use when a user, customer, stakeholder, support report, QA finding, or developer observation needs to be captured as a structured issue before business refinement, planning, or implementation.
compatibility: Designed for Codex, Claude Code, and Agent Skills-compatible coding agents with repository access and optional GitHub issue write access.
metadata:
  version: "1.1.0"
  category: "agent-workflow"
  workflow-stage: "intake"
  artifact-type: "issue"
  output-targets: "local,github"
  output-languages: "vi,en"
  local-artifact-path: ".issues/*.md"
  state-model: "draft-refined-ready-closed"
  author: "AnhBH"
---

# Issue Writing

## Overview

Convert a raw user claim, customer request, bug report, stakeholder request, QA finding, or observed problem into a concise structured issue.

The issue captures **what is being reported, why it matters, what is currently known, and what remains unresolved**. It is not a business specification and it is not an implementation plan.

**Core principle:**

> Capture the problem and uncertainty. Do not resolve business decisions while writing the issue.

Do not design the solution or implement code while using this skill.

---

## When to Use

Use this skill when:

- a user or customer reports a problem or requests a change;
- a stakeholder describes desired behavior informally;
- support, QA, or development discovers an issue worth tracking;
- a claim needs to become a persistent issue before refinement;
- later agents need a stable statement of the original problem without relying on chat history.

Do not use this skill to:

- define detailed business rules;
- finalize acceptance criteria for complex behavior;
- choose architecture or technical design;
- decompose implementation work;
- write implementation tasks;
- document completed system behavior.

Those responsibilities belong to downstream refinement, planning, task, and documentation skills.

---

## Output Options

Resolve two independent options before writing:

```text
Target:   LOCAL | GITHUB
Language: VI    | EN
```

Supported combinations:

```text
LOCAL  + VI
LOCAL  + EN
GITHUB + VI
GITHUB + EN
```

Do not create separate semantic versions of the issue for different targets. The issue content model is the same; only the destination and rendered language change.

---

## Target Resolution

Resolve the target in this order:

1. Use the target explicitly requested by the human.
2. Otherwise follow repository instructions only when they explicitly define a default issue tracker or destination.
3. Otherwise default to `LOCAL`.

### LOCAL

Create exactly one file:

```text
.issues/<issue-name>.md
```

Use a short, lowercase, kebab-case issue name.

Examples:

```text
.issues/student-tuition-hold.md
.issues/payment-cancellation.md
.issues/class-transfer-history.md
```

Create `.issues/` if it does not exist.

Use `issue-template.md` as the semantic structure when available.

The local file is the source of truth for that issue until a downstream workflow explicitly publishes or replaces it with another canonical tracker.

### GITHUB

Create exactly one GitHub Issue in the repository's issue tracker.

Use an available GitHub connector/tool or an authenticated repository-approved GitHub CLI workflow.

Do not create a local `.issues/*.md` mirror unless the human explicitly requests both outputs.

If GitHub write access is unavailable or the repository cannot be resolved, report the blocker. **Do not silently fall back to `LOCAL`.**

When `GITHUB` is explicitly selected, the created GitHub Issue is the source of truth.

### Dual Output

Do not create both `LOCAL` and `GITHUB` by default.

If the human explicitly requests both:

- create both from the same issue content;
- identify which destination is canonical;
- add a cross-reference where practical;
- do not allow the two copies to diverge silently.

---

## Language Resolution

Resolve the language in this order:

1. Use the language explicitly requested by the human.
2. Otherwise follow repository instructions when they define an issue language convention.
3. Otherwise use the language of the current conversation.

Supported values:

```text
VI = Vietnamese
EN = English
```

The selected language applies to:

- issue title;
- section headings;
- explanatory prose;
- scope items;
- constraints;
- unresolved decisions;
- reference notes.

Do not translate stable technical identifiers such as:

- code identifiers;
- API paths or method names;
- class/function/type names;
- file paths;
- database field names;
- CLI commands;
- project-specific terms intentionally standardized in English.

For `LOCAL`, include the selected language in the issue header:

```text
Language: VI
```

or:

```text
Language: EN
```

For `GITHUB`, do not add a `Language:` field to the issue body unless repository conventions require it.

---

## Heading Map

Render the same semantic structure in the selected language.

| Semantic section | EN | VI |
|---|---|---|
| User Claim | User Claim | Yêu cầu gốc |
| Current Problem | Current Problem | Vấn đề hiện tại |
| Affected Users | Affected Users | Người dùng bị ảnh hưởng |
| Expected Outcome | Expected Outcome | Kết quả mong đợi |
| Scope | Scope | Phạm vi |
| In Scope | In Scope | Trong phạm vi |
| Out of Scope | Out of Scope | Ngoài phạm vi |
| Constraints | Constraints | Ràng buộc |
| Known Context | Known Context | Bối cảnh đã biết |
| Unresolved Decisions | Unresolved Decisions | Quyết định chưa làm rõ |
| References | References | Tham chiếu |

Do not change the meaning or required content based on language.

---

## Issue Boundary

The issue is an **intake artifact**, not a final specification.

It SHOULD answer:

```text
1. What did the user/stakeholder report or request?
2. What problem exists today?
3. Who is affected?
4. What outcome is expected at a high level?
5. What is clearly in or out of the reported scope?
6. What constraints or known context already exist?
7. What important decisions are still unresolved?
```

It MUST NOT silently decide:

- calculation rules;
- billing or money behavior;
- permission policy;
- ownership rules;
- approval workflow;
- lifecycle or state transitions;
- destructive behavior;
- historical-data behavior;
- exception policy.

Record those as unresolved when the claim does not define them.

---

## Clarification Policy

Default behavior is to create a useful `DRAFT` issue without blocking on every missing detail.

Ask the human before writing only when the available claim is too ambiguous to identify the actual problem or expected outcome.

Good enough to capture:

```text
"Khách muốn cho phép bảo lưu học phí khi học sinh nghỉ giữa tháng."
```

Capture the request and list missing policy decisions under `Unresolved Decisions` / `Quyết định chưa làm rõ`.

Too ambiguous to capture safely:

```text
"Làm logic cũ giống bên kia."
```

The target behavior, source, and affected area are unknown, so clarification is required.

**Do not turn issue writing into business refinement.**

---

## Repository Context

When repository access exists, inspect only enough context to make the issue accurate.

Prefer:

1. repository instruction files such as `AGENTS.md` or `CLAUDE.md`;
2. related existing issues or product documents;
3. relevant module names and current user-visible behavior;
4. existing terminology used by the project.

Do not perform deep technical investigation unless needed to avoid stating an incorrect current behavior.

If repository evidence and the user's claim differ, preserve both explicitly rather than choosing one silently.

Example:

```markdown
## Known Context

- User reports that cancelled payments disappear from history.
- Current implementation appears to retain cancelled records with status `cancelled`.
- This discrepancy requires validation during refinement.
```

---

## Required Issue Model

Every issue MUST contain these semantic fields in the selected language:

```text
Title
Status
Type
Created
Language (LOCAL only)
User Claim
Current Problem
Affected Users
Expected Outcome
Scope
  - In Scope
  - Out of Scope
Constraints
Known Context
Unresolved Decisions
References
```

For `LOCAL + EN`, render:

```markdown
# <Issue Title>

Status: DRAFT
Type: FEATURE | CHANGE | BUG | BUSINESS_REQUEST
Created: YYYY-MM-DD
Language: EN

## User Claim
## Current Problem
## Affected Users
## Expected Outcome
## Scope
### In Scope
### Out of Scope
## Constraints
## Known Context
## Unresolved Decisions
## References
```

For `LOCAL + VI`, render:

```markdown
# <Tiêu đề issue>

Status: DRAFT
Type: FEATURE | CHANGE | BUG | BUSINESS_REQUEST
Created: YYYY-MM-DD
Language: VI

## Yêu cầu gốc
## Vấn đề hiện tại
## Người dùng bị ảnh hưởng
## Kết quả mong đợi
## Phạm vi
### Trong phạm vi
### Ngoài phạm vi
## Ràng buộc
## Bối cảnh đã biết
## Quyết định chưa làm rõ
## Tham chiếu
```

For `GITHUB`, use the same title and body sections but omit local-only header fields when they do not fit repository conventions. Keep `Status: DRAFT` semantics in the content only if the repository uses issue status in the body; otherwise the issue remains an intake-stage draft by workflow meaning.

If a section has no known information, write the selected-language equivalent of `None identified.` instead of inventing content.

Recommended equivalents:

```text
EN: None identified.
VI: Chưa xác định.
```

---

## GitHub Metadata

In `GITHUB` mode, do not invent optional tracker metadata.

Do not assign or create without evidence or instruction:

- assignees;
- labels;
- milestones;
- projects;
- sprint/iteration;
- priority;
- parent/child relationships;
- linked pull requests;
- issue dependencies.

Apply optional metadata only when:

1. the human explicitly requests it; or
2. repository instructions define a deterministic convention that applies to this issue.

When uncertain, leave optional metadata unset.

---

## Status Ownership

`issue-writing` creates issues only in the workflow state:

```text
DRAFT
```

Downstream workflow may move them through:

```text
DRAFT -> REFINED -> READY -> CLOSED
```

Do not mark an issue `REFINED` or `READY` while using this skill.

GitHub's native open/closed state is not equivalent to the workflow states above. A newly created GitHub Issue may be natively open while still semantically `DRAFT`.

---

## Writing Rules

### Preserve Intent

Rewrite for clarity, but do not broaden the request.

Bad:

```text
Claim: Allow student transfer.
Issue: Redesign the complete enrollment lifecycle.
```

Good:

```text
Claim: Allow student transfer.
Issue: Capture inability to move an active student to another class while preserving relevant history.
```

### Separate Facts from Unknowns

Known behavior belongs in `Current Problem` / `Vấn đề hiện tại` or `Known Context` / `Bối cảnh đã biết`.

Missing policy belongs in `Unresolved Decisions` / `Quyết định chưa làm rõ`.

Do not phrase an assumption as a requirement.

### Keep Technical Solutions Out

Do not add endpoints, tables, classes, queues, services, migrations, or architecture unless the source claim explicitly requires a technical constraint.

Bad:

```text
Expected Outcome: Add POST /payments/{id}/cancel and a cancelled_at column.
```

Good:

```text
Expected Outcome: Authorized users can cancel an eligible payment without losing required history.
```

### Keep Scope Bounded

If the source only supports `In Scope`, do not invent `Out of Scope` merely to fill the template. Use `None identified.` / `Chưa xác định.`.

---

## Unresolved Decision Heuristics

Actively surface uncertainty when the issue touches:

```text
money / billing / refunds
permissions / ownership
approval workflows
state or lifecycle transitions
calculations
cancellation / deletion
historical records
data migration
cross-tenant behavior
external integrations
```

Example:

```markdown
## Unresolved Decisions

- Which roles may cancel a payment?
- Which payment states are eligible for cancellation?
- Does cancellation restore the outstanding balance?
- Must cancellation history remain visible?
```

These are questions for refinement, not decisions for the issue writer.

---

## Self-Review

Before finishing, verify:

### Routing

- [ ] Target is resolved as `LOCAL` or `GITHUB`.
- [ ] Language is resolved as `VI` or `EN`.
- [ ] No unrequested duplicate output was created.
- [ ] `GITHUB` did not silently fall back to `LOCAL`.

### Fidelity

- [ ] The issue matches the original claim.
- [ ] No unrelated scope was added.
- [ ] Facts and assumptions are separated.

### Intake Quality

- [ ] Current Problem is understandable without chat history.
- [ ] Expected Outcome states the desired result at a high level.
- [ ] Affected users are identified where known.
- [ ] Important unresolved decisions are visible.

### Boundary

- [ ] No detailed business policy was invented.
- [ ] No technical design was invented.
- [ ] No implementation tasks were created.
- [ ] Workflow status remains `DRAFT`.

### Language

- [ ] Headings and prose use the selected language consistently.
- [ ] Technical identifiers were preserved rather than translated.

### GitHub Metadata

- [ ] No assignee, label, milestone, project, priority, or sprint was invented.

---

## Skill Validation Scenarios

Use these scenarios when validating changes to this skill.

### Scenario 1 — Default Local Vietnamese

Input:

```text
Khách muốn cho phép hủy khoản thanh toán.
```

Expected behavior:

- resolve `Target: LOCAL` when no repository rule overrides it;
- resolve `Language: VI` from the conversation;
- create a `DRAFT` `.issues/*.md` issue;
- capture the cancellation problem and desired high-level outcome;
- list permission, eligibility, financial effect, and history policy as unresolved;
- do not decide those policies.

### Scenario 2 — Explicit GitHub English

Input:

```text
Create a GitHub issue in English for allowing students to transfer between classes.
```

Expected behavior:

- resolve `Target: GITHUB`;
- resolve `Language: EN`;
- create exactly one GitHub Issue;
- do not create `.issues/*.md`;
- do not invent labels, assignees, priority, or milestone;
- do not invent API endpoints, schema changes, or service names.

### Scenario 3 — Explicit Local English

Input:

```text
Viết issue này vào local .issues bằng tiếng Anh: khách cần bảo lưu học phí.
```

Expected behavior:

- resolve `Target: LOCAL`;
- resolve `Language: EN` even though the conversation is Vietnamese;
- create one English issue under `.issues/`;
- include `Language: EN` in the local header.

### Scenario 4 — GitHub Unavailable

Input:

```text
Tạo GitHub issue cho lỗi này.
```

Environment:

```text
No GitHub issue write access is available.
```

Expected behavior:

- report that GitHub creation is blocked;
- do not silently create a local issue instead.

### Scenario 5 — Insufficient Claim

Input:

```text
Làm giống logic bên kia.
```

Expected behavior:

- request clarification because the actual problem cannot be identified safely;
- do not fabricate an issue from repository guesses alone.

---

## Final Response

For `LOCAL`, report only in the conversation language:

```text
Issue created: .issues/<issue-name>.md
Target: LOCAL
Language: <VI|EN>
Status: DRAFT
Unresolved decisions: <N>
Next: business refinement required before planning.
```

For `GITHUB`, report only in the conversation language:

```text
GitHub issue created: #<number> <url-or-reference>
Target: GITHUB
Language: <VI|EN>
Status: DRAFT
Unresolved decisions: <N>
Next: business refinement required before planning.
```
