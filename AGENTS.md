# Agent Guide

This file is a routing index for AI assistants working in this repository. Rules and documents are the sources of truth; do not duplicate their content here. Read the global rule and every scoped rule whose `metadata.paths` matches the task before making changes.

## Behavioral Rules

All behavioral guidelines live in `.agents/rules/` and are loaded automatically (`alwaysApply: true`). Do not duplicate them here — the rule files are the single source of truth.

| File                                    | What it governs                                                                                                         |
|-----------------------------------------| ----------------------------------------------------------------------------------------------------------------------- |
| `.agents/rules/coding-approach.md`      | Repository-wide reasoning, scope control, surgical changes, and verification.                                           |
| `.agents/rules/api/coding-standards.md` | Backend PHP/Laravel coding conventions, named arguments, Action error boundaries, and module error declarations.      |
| `.agents/rules/database-rules.md`       | Shared backend database conventions, schema reference, migration discipline, and module-to-schema mapping.              |
| `.agents/rules/frontend/academic-api.md` | Academic frontend TypeScript API contracts, form schemas, request types, and explicit endpoint paths.                |
| `.agents/rules/multi-agent-orchestration.md` | Pi subagent routing, delegation, parallelism, review, escalation, and cost discipline. |

## Available Repository Skills (`/skill-name`)

| Skill                      | When to use                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/configuring-horizon`     | Install, configure, authorize, monitor, or troubleshoot Laravel Horizon.                             |
| `/executing-task-phases`   | Execute implementation work already tracked in a `.tasks` Markdown ledger.                           |
| `/issue-writing`           | Capture a request, report, or finding as a structured DRAFT issue before refinement or planning.     |
| `/laravel-best-practices`  | Write, review, or refactor Laravel PHP code and framework behavior.                                  |
| `/pest-testing`            | Write, edit, fix, or refactor Pest tests in the Laravel API.                                         |
| `/planning-to-tasks`       | Convert an approved implementation plan into resumable phase and verification checklists.            |
| `/review-code`             | Review a branch, pull request, or code change and produce an evidence-backed Markdown review.        |
| `/tailwindcss-development` | Build or change Tailwind CSS layouts, components, responsive behavior, or styling.                   |
| `/write-documentation`     | Create or update durable documentation from verified implementation and current repository evidence. |

Each repository skill is defined by `.agents/skills/<skill-name>/SKILL.md`; read that file before using the skill.

## Documents

Context documents are evidence-backed repository baselines. They describe current facts and explicit unknowns; rules remain the source of behavioral requirements and subsystem guides remain the source of operational detail.

| Document            | What it contains                                                                                                                 |
|---------------------| -------------------------------------------------------------------------------------------------------------------------------- |
| `docs/database.md`  | Current database schema reference, including tables, columns, constraints, indexes, and migration source locations.              |
| `docs/local-development.md` | Current local environment reference: services and ports, host prerequisites (`/etc/hosts` entries, `pdo_pgsql`), the failure modes those cause, and how to verify UI changes. |
| `docs/design.md`    | Current frontend design system reference: design tokens, typography, theme mapping, CSS layers, shell layout, and the shared component library. |
| `docs/opendesign.md` | Current OpenDesign reference: which project is primary, the active design system and what a run actually receives, brand assets, and where the design system intentionally leads the shipped frontend. |


## Definition of Done

- The requested scope is delivered without unrelated changes.
- Applicable rules and source-of-truth documents remain consistent.
- Relevant verification passes, and the final report includes evidence and any remaining blocker.
