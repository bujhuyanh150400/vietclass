---
description: Shared backend database overview, schema-reference, and migration-discipline rules.
alwaysApply: true
metadata:
  scope: backend
  paths:
    - "api/**"
    - "admin/**"
---

# Database Rules

Apply this rule to backend database work in API, Admin, and any future backend application.

## Database Overview and Reference

- Read [`docs/database.md`](../../docs/database.md) before changing a backend schema. It is the in-context database schema reference.
- Migrations remain the executable source of truth. Keep the reference accurate enough to understand the current schema without reverse-engineering migrations.
- Follow any repository-specific persistence rule in addition to this rule. For example, API model, factory, repository, and migration placement rules remain in `api/database-rule.md`.

## Migration Discipline

Whenever you add, remove, or modify a column, table, index, constraint, or enum in a migration, you must also update:

- [`docs/database.md`](../../docs/database.md) — the in-context schema reference.
- The **Module-to-schema mapping** in this file when the change adds, removes, or changes a module's schema ownership.

Make those documentation changes in the same commit as the migration.

## Schema Conventions

- Use a `BIGINT` auto-increment primary key for application tables. Add a unique UUID only when a table needs a secondary linkage key.
- Include `created_at` and `updated_at` on application tables to record creation and update time.
- Use `timestamptz` for important instants, including payment, lock, submitted, reviewed, and finalized times.
- Use `date` for billing months. Store the first day of the month, for example `2026-06-01`.
- Use `numeric(12,0)` for Vietnamese-dong amounts. Do not use `float` or `double`.
- When needed by an important business table, add `created_by` and `updated_by` for user actions, `deleted_at` for soft deletion, and `metadata jsonb` for snapshots or supporting data.

## Enums

- Persist every database enum as `SMALLINT` (2 bytes). Do not use PostgreSQL native enum types or text values.
- Stored enum values are integers starting at `0`.
- The frontend may mirror an enum when the UI must render or filter by it.
- Adding an enum value only requires updating the enum and its frontend mirror when present; it does not require a database migration.

## Module-to-Schema Mapping

Keep this mapping current whenever schema ownership changes. Detailed columns, constraints, and indexes belong in [`docs/database.md`](../../docs/database.md).

| Backend scope | Schema responsibility | Current tables | Migration location |
| --- | --- | --- | --- |
| API / Identity | User identity and profile records: login accounts, shared personal profiles, the teaching role, the student role, and the guardian–student relationship. | `users`, `personal_access_tokens`, `profiles`, `teacher_profiles`, `student_profiles`, `student_guardians` | `api/database/migrations/` |
| API / Auth | Permission catalogue and per-user permission overrides. Role defaults stay in code. | `features`, `feature_user` | `api/database/migrations/` |
| API / System | Mutable system-wide configuration and the account that last changed it. | `system_settings` | `api/database/migrations/` |
| API / FileManagement | Private file metadata, immutable ownership, and typed domain usage links. | `files`, `file_links` | `api/database/migrations/` |
| API / Academic | Academic-process data that references Identity's `teacher_profiles` and `student_profiles`: subjects, classes, class enrolment, and the teaching rooms classes are scheduled into. | `subjects`, `classes`, `class_enrollments`, `rooms` | `api/database/migrations/` |
| API / Schedule | No Schedule schema is registered: the module was removed and its schema is being redesigned. Rooms belong to Academic. | — | — |
| API / framework runtime | Laravel session, cache, and queue tables. | `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs` | `api/database/migrations/` |
| API / future modules | Each module owns its schema mapping, but all migrations remain centralized. | — | `api/database/migrations/` |
| Admin | No Admin schema is registered yet. | — | — |
