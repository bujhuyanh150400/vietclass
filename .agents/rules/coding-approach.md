---
description: Core implementation approach for all work in this repository.
alwaysApply: true
metadata:
  scope: global
  paths:
    - "**/*"
---

# Coding Approach

## Think Before Editing

- Read the relevant code, configuration, tests, and documentation before changing files.
- Define the requested outcome, the change boundary, and verifiable success criteria first.
- Separate facts discovered in the repository from assumptions. Do not create a new convention when the repository and the user have not established one.

## Make Surgical Changes

- Change only files and behavior required by the task.
- Preserve unrelated behavior, public contracts, formatting, and user-owned work.
- Do not combine the requested work with opportunistic refactors or cleanup.

## Function Intent Comments

- Add a concise comment or documentation block immediately above every non-test function you add or change.
- State what the function does and the outcome it is intended to achieve; do not restate line-by-line implementation details.
- Follow the language's established comment/documentation convention in the touched code.
- Test functions and test helpers are exempt from this requirement.

## Verify the Outcome

- Run checks that directly prove the success criteria for the changed scope.
- Read the complete verification output and resolve failures before claiming completion.
- Report the commands run, their results, and any remaining limitation or blocker.

## Keep Feature Documentation Current

- Before marking a task complete, assess whether its verified changes affect feature documentation.
- When a task changes user-visible behavior, business rules, roles or permissions, workflow steps, outcomes, errors, limitations, or relationships between features, update the affected files under `docs/documentation/` in the same task.
- Update `docs/documentation/README.md` when a documented feature is added, renamed, moved, or removed.
- When a task changes only internal implementation and the existing feature documentation remains accurate, record the documentation impact as `NO_CHANGE` instead of creating filler documentation.
- Use `/write-documentation` and current repository evidence for documentation updates. Do not mark the task complete while affected feature documentation is stale.
