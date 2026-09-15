---
name: write-documentation
description: Use when verified user-facing behavior or business rules need durable feature documentation, when a completed behavior change may make existing docs stale, or when functional docs are being migrated into docs/documentation.
---

# Write Documentation

## Overview

Create or update durable documentation from verified repository behavior.

For VietClasses, organize user-facing and business knowledge by feature under `docs/documentation/`. Group feature files by owning module so readers can discover them, but keep each document centered on one capability a user can understand or operate.

**Core principle:** implementation and verification establish current behavior; feature documentation preserves that behavior, its user workflow, and its effects on related capabilities.

Do not use this skill to decide requirements, write an implementation plan, or record execution history.

## Documentation Contract

Use this structure for functional documentation:

```text
docs/documentation/
├── README.md
└── <module>/
    └── <feature>.md
```

- Treat `docs/documentation/README.md` as the canonical feature index.
- Use one file per user-visible feature or coherent user workflow.
- Use module directories for ownership and navigation, not as broad domain documents.
- Use lowercase kebab-case for module directories and feature filenames.
- Keep a feature in the module that owns its primary behavior. Describe cross-module effects in the relationship section instead of duplicating the feature.
- Prefer updating an existing canonical feature file over creating an overlapping document.

Example:

```text
docs/documentation/
├── README.md
├── identity/
│   ├── login.md
│   ├── login-help.md
│   └── account-menu-logout.md
└── tenancy/
    └── tenant-context.md
```

## Documentation Boundaries

Keep each fact in the source of truth that owns it:

| Location | Owns |
| --- | --- |
| `docs/documentation/` | Feature purpose, business rules, user steps, results, exceptions, and relationships to other features |
| `docs/contexts/` | Current repository, subsystem, runtime, and integration baselines |
| `docs/adrs/` | Architectural decisions and durable rationale |
| `docs/deployment/` | Deployment and operational procedures |
| `docs/database.md` | Current database schema reference |
| `api/docs/openapi/openapi.yaml` | Canonical public API contract |

Link to a canonical technical source instead of copying its schema, payload, or implementation detail into feature documentation. Include only the technical context needed to explain verified user-facing behavior.

## Evidence Priority

Use evidence in this order:

```text
1. Verified tests or deterministic verification
2. Current implementation
3. Current configuration, schema, and public interfaces
4. Completed .tasks evidence
5. Approved plan or specification
6. Issue or original claim
7. Conversation history
```

Higher-priority evidence overrides lower-priority intent when describing current behavior. Do not silently reconcile contradictions.

If a plan says logout redirects to `/login` but verified implementation redirects to `/`, document `/` and report the conflict when the planned behavior remains authoritative.

## Preconditions

Before documenting a completed change, confirm:

- the relevant implementation exists;
- task or phase verification is complete when a task ledger exists;
- targeted tests or deterministic checks support the behavior;
- no unresolved blocker makes the behavior provisional.

For an already-existing feature without a task ledger, inspect current code, tests, configuration, public contracts, and related docs directly.

Stop when documentation would present unverified behavior as fact.

## Workflow

### 1. Discover the affected knowledge

Inspect:

- the completed issue, plan, and task ledger when available;
- implementation and verification evidence;
- the owning module and public contract;
- existing feature docs and inbound links;
- features that provide prerequisites or consume changed state.

Do not infer the documentation impact from changed filenames alone.

### 2. Classify documentation impact

Assign one result to every affected feature or documentation area:

```text
CREATE     no canonical feature document exists and durable behavior is verified
UPDATE     verified knowledge in an existing document changed or became incomplete
NO_CHANGE  implementation changed but durable documented behavior did not
BLOCKED    verification or authoritative evidence conflicts prevent an accurate update
```

Examples that normally require `CREATE` or `UPDATE`:

- user workflow or navigation changes;
- business rules, roles, permissions, or prerequisites change;
- results, state transitions, errors, or edge cases change;
- a public contract change alters how the feature behaves;
- one feature changes the state, availability, or outcome of another feature.

An internal refactor with unchanged behavior, contracts, configuration, and operations is `NO_CHANGE`.

### 3. Select the canonical feature document

Choose `docs/documentation/<module>/<feature>.md` based on the primary capability, not the implementation class or page component.

If one change affects several features:

- update every feature document whose own verified behavior changed;
- add or update cross-links where the relationship changed;
- leave a related document unchanged when only its link remains useful and its behavior did not change.

Do not put all cross-feature behavior into a broad module document.

### 4. Write the feature document

Start from `documentation-template.md`. Keep the following section order so users and agents can scan consistently:

1. `Tổng quan`
2. `Người dùng và điều kiện`
3. `Quy tắc nghiệp vụ`
4. `Hướng dẫn thao tác`
5. `Kết quả mong đợi`
6. `Lỗi và trường hợp ngoại lệ`
7. `Quan hệ với chức năng khác`
8. `Giới hạn hiện tại`
9. `Tham chiếu kỹ thuật`

Use `Không áp dụng` or `Không có ... đã được xác định` when a required section has no verified content. Do not silently omit relationship, exception, or limitation analysis.

### 5. Update navigation and references

When creating, renaming, moving, or removing a feature document:

- update `docs/documentation/README.md`;
- update direct inbound links and repository indexes;
- keep module and feature labels understandable to non-technical readers;
- verify that no stale path remains.

An edit within an existing file does not require an index change unless its title, purpose, module, or verification date shown in the index changed.

### 6. Verify the documentation

Re-read each changed document against implementation and tests. Check paths, commands, route names, states, roles, and relationships exactly where included.

Search for stale statements and stale links affected by the change. Report any unverified claim or unresolved conflict instead of filling the gap with an assumption.

## Feature Document Rules

### Traceability

Use this header:

```markdown
# <Tên chức năng>

Last Verified: YYYY-MM-DD
Related Issue: `.issues/<issue>.md`
Related Task: `.tasks/<task>.md`
```

- Always include `Last Verified` using the date of the evidence actually checked.
- Include issue and task paths only when they exist.
- Keep the document understandable without opening the issue or task ledger.

### Current behavior

Write verified behavior in present tense. Do not use planning language such as “sẽ”, “dự kiến”, or “nên” to describe behavior that supposedly exists.

Use Vietnamese for reader-facing prose and headings. Preserve exact technical identifiers such as route paths, status values, API fields, and configuration keys.

### User instructions

Write steps from the user's starting point through the observable result. Include prerequisites and role restrictions before the numbered steps.

Only mention controls, labels, pages, and messages verified in the current interface. Add screenshots only when a stable, current repository asset exists and materially improves the workflow.

### Business rules and exceptions

State rules as observable constraints or outcomes. Include stable rule identifiers only when the repository already defines them.

Separate normal results from validation failures, authorization failures, unavailable states, and known limitations. Do not invent fallback behavior.

### Feature relationships

For each meaningful relationship, identify:

- the related feature;
- whether it is a prerequisite, dependency, downstream effect, or shared state;
- what data, state, permission, or availability crosses the boundary;
- what the user observes when the relationship applies.

Link to the related canonical feature document when it exists. If no relationship is verified, state `Không có quan hệ nghiệp vụ với chức năng khác đã được xác định.`

### Technical references

Link only to stable sources that help maintain the feature, such as the public API contract, owning module entry point, route definition, deterministic tests, or relevant context document.

Avoid private helper names, line-by-line implementation narration, and copied API or database definitions.

## Updating Documentation After Changes

After every verified implementation update, run documentation impact analysis before closing the work.

- Update the feature document in the same change when user-visible behavior or durable business knowledge changed.
- Update related feature documents only when their own behavior or relationship knowledge changed.
- Refresh `Last Verified` on every feature document whose content was revalidated and changed.
- Return `NO_CHANGE` explicitly for internal-only work when documentation remains accurate.
- Do not create filler documentation merely because a task completed.

## Migrating from `docs/business/`

`docs/documentation/` replaces `docs/business/` as the target source of truth for functional and user-facing documentation.

During migration:

1. inventory every section and inbound link under `docs/business/`;
2. map each verified fact to a feature document, a retained technical source, or an explicit removal reason;
3. create the feature index and feature files;
4. update repository indexes and inbound links;
5. verify content coverage and links;
6. remove the superseded business documents only after their durable facts are mapped.

Do not maintain two canonical copies. If migration is not authorized within the current task and an existing `docs/business/` document overlaps the requested feature, report the migration dependency instead of creating a competing source of truth.

Keep domain-wide technical facts in the appropriate context, ADR, database, or contract document. Distribute user-facing rules and flows into the feature files that own them.

## Conflict Handling

Return `BLOCKED` when:

- implementation contradicts an authoritative business rule;
- tests and implementation disagree;
- a task ledger reports verification that currently fails;
- two authoritative documents define incompatible behavior;
- migration scope does not permit resolving overlapping canonical documents.

Report:

```text
Documentation blocked by evidence conflict:
- Expected: <source + behavior>
- Actual: <source + behavior>
- Required resolution: <decision or fix needed>
```

A stale non-authoritative document does not block the update. Replace its claim with verified behavior and update affected links.

## Quick Reference

| Change | Documentation result |
| --- | --- |
| New verified user-facing feature | Create its feature file and index entry |
| Existing feature behavior changed | Update its canonical feature file |
| Feature A changes Feature B's behavior | Update both affected feature files and their relationship sections |
| Public contract changes without user-visible effect | Update the canonical contract; feature doc is `NO_CHANGE` |
| Internal refactor only | `NO_CHANGE` |
| Required verification missing | `BLOCKED` |
| Old `docs/business/` content overlaps | Migrate within authorized scope or report the migration dependency |

## Common Mistakes

| Mistake | Correction |
| --- | --- |
| Writing one broad file per module | Write one file per coherent user-visible feature under the module directory |
| Combining requirements and current behavior | Document only verified current behavior; keep requirements in issue or planning artifacts |
| Updating only the directly edited screen | Inspect and update affected upstream and downstream feature relationships |
| Copying OpenAPI or schema details | Link to the canonical contract or schema reference |
| Creating `docs/documentation/` beside overlapping `docs/business/` content | Complete an authorized migration or report the dependency |
| Refreshing `Last Verified` without checking evidence | Use the date of actual deterministic verification |
| Documenting private code structure | Prefer stable behavior, ownership, and public boundaries |

## Validation Scenarios

### New verified feature

An account menu and logout flow has verified UI and tests, but no feature document exists.

Expected: create `docs/documentation/identity/account-menu-logout.md`, add its index entry, and describe user steps, logout results, exceptions, and relationships to login/session behavior.

### Existing behavior changes

Logout now revokes all sessions instead of only the current session.

Expected: update the existing logout feature document and every related feature document whose verified session behavior changes. Do not create another logout document.

### Internal refactor

Session service internals change while user flow, contracts, configuration, and outcomes remain identical.

Expected: return `NO_CHANGE`.

### Cross-feature impact

Disabling a tenant now prevents login for its members.

Expected: update both affected feature documents if both behaviors changed, describe the prerequisite/downstream relationship, and keep the tenant and login rules in their owning files.

### Plan differs from verified code

The plan says logout redirects to `/login`; verified implementation and tests redirect to `/`.

Expected: document `/` as current behavior and surface any unresolved authoritative conflict.

### Migration from domain docs

`docs/business/identity.md` contains login, session, and logout facts while the target convention is feature-based.

Expected: map each verified fact into separate feature documents or retained technical sources, update inbound links and the index, then remove the superseded canonical content. Never keep both copies as sources of truth.

### Verification missing

A task is marked complete but its required regression verification has not run.

Expected: return `BLOCKED` and do not present the new behavior as verified.

## Completion Check

Before finishing, confirm:

- [ ] Current behavior is supported by repository evidence.
- [ ] Every affected feature has a `CREATE`, `UPDATE`, `NO_CHANGE`, or `BLOCKED` result.
- [ ] One canonical feature file owns each documented workflow.
- [ ] User steps, outcomes, exceptions, and feature relationships were checked.
- [ ] Related feature docs were updated only where durable knowledge changed.
- [ ] The feature index and inbound links are current.
- [ ] `Last Verified` matches the evidence date.
- [ ] No unresolved authoritative conflict remains.
- [ ] No overlapping `docs/business/` and `docs/documentation/` sources remain after an authorized migration.

## Final Response

When documentation changed:

```text
Documentation updated: <path(s)>
Impact: CREATE <N>, UPDATE <N>, NO_CHANGE <N>
Evidence: <verification and repository checks>
```

When no change is needed:

```text
Documentation impact: NO_CHANGE
Reason: <concise reason>
```

When blocked:

```text
Documentation blocked: <missing verification, migration dependency, or evidence conflict>
```
