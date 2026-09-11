# Database reference

Last verified: 2026-09-10

Database engine: PostgreSQL. Migrations under `api/database/migrations/` are the executable source of truth. Framework runtime, Identity, Auth, Academic, System, and File Management tables exist. No Schedule table exists: the module was removed and its schema is being redesigned. The Academic schema is a deliberate adaptation of the fork's, not a copy; each divergence is noted where it occurs.

## Identity

User identity and profile records: login accounts, plus four profile tables — one shared personal-record table (`profiles`) and three thin role tables built on top of it (`teacher_profiles`, `student_profiles`, `student_guardians`). All six tables are owned by `API / Identity`.

`teacher_profiles.profile_id` and `student_profiles.profile_id` are each both the table's own primary key and a foreign key back to `profiles.id`, so a teacher or a student is one `profiles` row plus one matching row in its role table. Sharing the key this way is what lets `classes.teacher_id` and `class_enrollments.student_id` (Academic) target a role table instead of `profiles` directly: a profile with no row in `teacher_profiles` cannot be referenced as a class's teacher, so the database itself refuses to make a student someone's teacher, with no `type` column or application check involved. A guardian has no role table of its own; that role exists only as a row in `student_guardians` linking a student profile to a guardian's `profiles` row.

No table here uses soft deletion except `users` itself, because no profile row is ever hard-deleted: a teacher is retired by deactivating the profile and soft-deleting the login account, a student by changing `status`. `teacher_profiles.profile_id` cascades on delete from `profiles`, and `student_guardians.student_profile_id` cascades from `student_profiles`, but nothing in the application ever triggers that path.

Bank details on the profile that is a teacher, and the class and enrolment fee columns noted in Academic, are gone from this schema entirely. They were pre-created on the earlier `teachers`, `classes`, and `class_enrollments` tables on the reasoning that a future finance module would then need no migration of its own; that reasoning has been abandoned. Money columns belong to whichever module owns the money process, and that module writes its own migration when it needs them.

### `users`

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | User identifier. |
| `username` | VARCHAR(50), unique | Login identifier. |
| `password` | VARCHAR(255) | Hashed by the model cast. |
| `remember_token` | VARCHAR(100), nullable | Laravel remember-token compatibility. |
| `role` | SMALLINT, default `0`, indexed | `0` Admin, `1` Teacher, `2` Student, `3` Guardian (`UserRole`). |
| `is_active` | BOOLEAN, default `true` | Inactive users cannot log in. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |
| `deleted_at` | timestamp, nullable | Soft deletion. |

### `personal_access_tokens`

Provided by Laravel Sanctum.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Token identifier. |
| `tokenable_type`, `tokenable_id` | polymorphic index | Links a token to a user. |
| `name` | TEXT | Configured token label. |
| `token` | VARCHAR(64), unique | Stored hash, never the plain bearer token. |
| `abilities` | TEXT, nullable | Sanctum abilities. |
| `last_used_at` | timestamp, nullable | Last authenticated use. |
| `expires_at` | timestamp, nullable, indexed | Per-token expiration. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `profiles`

Every human the system knows about: teacher, student, or guardian. A person who holds more than one role — a teacher who is also their own child's guardian — is still exactly one row here.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Profile identifier. |
| `user_id` | BIGINT, nullable, unique, FK `users` | `NULL` when this person has no login account. Guardian profiles are created this way; a student profile always has one. The unique constraint supplies the index. |
| `full_name` | VARCHAR(255) | Display name. Collated `vi-VN-x-icu`, so `ORDER BY full_name` sorts Vietnamese names correctly without any query saying so — invisible in application code, set once in the migration. |
| `phone` | VARCHAR(20), nullable, indexed | **Not unique, at any layer.** Teachers, students, and guardians share this one table, and a teacher is allowed to use their own number as a child's guardian contact; the Identity module's guardian-matching lookup also depends on more than one profile being able to share a number. |
| `email` | VARCHAR(255), nullable | Not unique either, for the same reason. Students and guardians mostly have none. |
| `dob` | DATE, nullable | Date of birth. |
| `gender` | SMALLINT | `0` Nam, `1` Nữ, `2` Khác. Required for every profile, including guardians entered from the student form. |
| `address` | TEXT, nullable | Postal address. |
| `note` | TEXT, nullable | Free-text note. |
| `metadata` | JSONB, default `'{}'` | Raw import data and one-off custom fields only. Anything filtered, sorted, referenced by foreign key, or validated must be a real column instead. |
| `avatar_config` | JSONB, nullable | Optional avatar display configuration. The avatar file itself resolves only through a `file_links` row of type `0` (`ProfileAvatar`). |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `teacher_profiles`

The teaching role. One row per teacher, on top of that teacher's `profiles` row.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `profile_id` | BIGINT, primary key, FK `profiles` cascade on delete | Not auto-increment: the value is `profiles.id`, reused as this table's own primary key — see the Identity section intro for why. |
| `status` | SMALLINT, default `0`, indexed | `0` Đang làm việc, `1` Đã nghỉ. Only an active teacher may be assigned to a class. |
| `joined_at` | DATE | Start of employment. |
| `color_identification` | VARCHAR(20), nullable | Calendar colour, reserved for a future timetable module. Renamed from `color` on the old `teachers` table. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `student_profiles`

The student role. One row per student, on top of that student's `profiles` row.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `profile_id` | BIGINT, primary key, FK `profiles` cascade on delete | Not auto-increment: the value is `profiles.id`, reused as this table's own primary key. |
| `grade_level` | SMALLINT, indexed | Same scale as `classes.grade_level`. |
| `status` | SMALLINT, default `0`, indexed | `0` Đang học, `1` Tạm nghỉ, `2` Dừng hẳn. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `student_guardians`

The many-to-many link between a student and the profiles acting as their guardians. A student may have both a father and a mother recorded; a guardian profile may be linked to more than one student (siblings sharing one guardian).

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Link identifier. |
| `student_profile_id` | BIGINT, indexed, FK `student_profiles(profile_id)` cascade on delete | The student. |
| `guardian_profile_id` | BIGINT, indexed, FK `profiles(id)` restrict on delete | The guardian. Restrict, not cascade: a profile still recorded as somebody's guardian may not be deleted. |
| `relationship` | SMALLINT | `0` Bố, `1` Mẹ, `2` Người giám hộ khác (`GuardianRelationship`). |
| `is_primary` | BOOLEAN, default `false` | Marks the main contact for the student. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |
| — | unique (`student_profile_id`, `guardian_profile_id`) | The same pair cannot be linked twice. |
| — | unique (`student_profile_id`) WHERE `is_primary` | A PostgreSQL partial unique index: at most one primary-contact row per student. The rule is enforced at the data layer, not in application code. |

## Auth

Permission catalogue and per-user overrides, plus bearer-token authentication. Role
defaults are declared in code by each module's `FeatureEnum`, never in the database; these
tables only mirror the catalogue and record exceptions for individual users.

### `features`

Owned by `API / Auth`. Rows are written by `auth:sync-features` and `AuthSeeder`
from the registered feature enums; they are never deleted automatically.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Feature identifier. |
| `code` | VARCHAR(100), unique | Stable permission code, for example `subject.create`. |
| `name` | VARCHAR(150) | Caller-facing name from the declaring enum's `label()`. |
| `group_code` | VARCHAR(50), indexed | Catalogue grouping from the enum's `group()`. |
| `description` | TEXT, nullable | Operator note; not written by the sync command. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `feature_user`

Owned by `API / Auth`. Holds only exceptions: a row overrides whatever the user's role
grants by default. Absence of a row means the role default applies.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Override identifier. |
| `user_id` | BIGINT, indexed, FK `users` cascade on delete | Subject of the override. |
| `feature_id` | BIGINT, indexed, FK `features` cascade on delete | Permission being overridden. |
| `granted` | BOOLEAN, default `true` | `true` adds a permission the role lacks; `false` withdraws one it has. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |
| — | unique (`user_id`, `feature_id`) | At most one override per user and permission. |

Effective permissions resolve as `defaults(user.role) ∪ granted − denied`, restricted to
codes a module still declares. A user with `is_active = false` holds none, because a bearer
token issued before deactivation stays valid until it expires.

## Academic

Academic-process data, in dependency order: subject, class, enrolment, plus the teaching rooms those classes are scheduled into. All four tables are owned by `API / Academic`. `classes.teacher_id` targets Identity's `teacher_profiles(profile_id)` and `class_enrollments.student_id` targets `student_profiles(profile_id)`, and neither can be assigned a profile lacking the matching role (see Identity). `rooms` references nothing: it is a bare resource a future timetable module will point at, and deleting one is refused while anything still references it. No table here uses soft deletion: a room is hard-deleted only when nothing references it, an enrolment ends by setting `left_at`, and a class ends by changing `status`.

`classes` and `class_enrollments` carry no money columns. Two class fee columns and one enrolment fee column were pre-created here and dropped for the reason given in Identity: money columns belong to whichever module owns the money process.

### `subjects`

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Subject identifier. |
| `name` | VARCHAR(50), unique | The fork enforced this only in its service layer. |
| `description` | TEXT, nullable | Free-text description. |
| `is_active` | BOOLEAN, default `true`, indexed | An inactive subject cannot be assigned to a new class. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `classes`

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Class identifier. |
| `code` | VARCHAR(50), unique | Immutable after creation. |
| `name` | VARCHAR(50) | Display name. |
| `subject_id` | BIGINT, indexed, FK `subjects` | Subject taught. |
| `teacher_id` | BIGINT, indexed, FK `teacher_profiles(profile_id)` (Identity) | Teacher responsible. Can only reference a profile that holds the teaching role. |
| `grade_level` | SMALLINT, indexed | `0` pre-primary, `1`–`12` the grade number. |
| `max_students` | SMALLINT, default `0` | Places from `1` to `32767`. PostgreSQL has no unsigned integer type, so `unsignedSmallInteger()` yields a signed `smallint`; the Form Requests cap at that ceiling rather than at `65535`. The fork used a tinyint, capping every class at 255. |
| `status` | SMALLINT, default `0`, indexed | `0` Đang hoạt động, `1` Kết thúc. |
| `start_at` | DATE | Opening date; immutable after creation. |
| `end_at` | DATE, nullable | Closing date, set when the class ends. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

### `class_enrollments`

One period of a student's membership in a class. A student who leaves and returns has
several rows for the same class.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Enrolment identifier. |
| `class_id` | BIGINT, indexed, FK `classes` | Class joined. |
| `student_id` | BIGINT, indexed, FK `student_profiles(profile_id)` (Identity) | Student enrolled. Can only reference a profile that holds the student role. |
| `enrolled_at` | DATE | Join date; may not precede `classes.start_at`. |
| `left_at` | DATE, nullable | Leave date; `NULL` while still enrolled. |
| `note` | TEXT, nullable | Free-text note. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |
| — | index (`class_id`, `student_id`), **not unique** | Re-enrolment after leaving is allowed and preserves history. |

An enrolment is **active** when `left_at IS NULL OR left_at > today`. At most one active
row may exist per class and student. That rule depends on the current date, so it cannot
be expressed as an index predicate and is enforced in the application instead.

`ClassEnrollment::active()` is the single definition of that rule in the application.
Capacity counts, duplicate checks, rosters, and the student list all share it, so they
cannot disagree about who is still enrolled. Do not restate the `left_at` condition in a
new caller.

#### The one sanctioned Identity → Academic crossing

`StudentProfile::activeEnrollments()` (Identity) is a `HasMany` onto this table
(Academic). It is the **only** relation pointing that way, and it exists so the student
list can name the classes a student attends.

Everywhere else the dependency runs Academic → Identity: `classes.teacher_id` and
`class_enrollments.student_id` target Identity's role tables, `ClassEnrollment` belongs
to `StudentProfile`, `ClassEnrollmentRepository` queries `StudentProfile` directly, and
`EnrollmentController` renders Identity's `StudentResource`. Identity was the lower
layer, and the docblock on
`ClassEnrollmentRepository::paginateAvailableForClass()` used to state that
`StudentProfile` must never reference `ClassEnrollment` back. That paragraph has been
rewritten to name this relation instead, so the rule and the code agree.

Why the relation rather than data computed in Academic and handed to the resource:

- `StudentResource` is rendered from six call sites: `StudentController::index`,
  `store`, `show`, `update`, and `toggleAccount`, plus Academic's
  `EnrollmentController::available`. (`changePassword` answers `204` and renders no
  resource.) A relation travels with the model and is therefore correct at all six.
  Pre-computed data has to be injected at each one, and a call site that forgets returns
  `[]` — wrong data, reported silently.
- `paginated()` in `app/Core/Http/Concerns/HandleApi.php` takes a resource **class name**
  and calls `$resourceClass::collection(...)` itself. There is no seam for passing
  per-item data, so injecting it would mean changing a helper every list endpoint in the
  application depends on.

A missing eager load on this relation costs query count, not correctness, and
`IdentityStudentTest` asserts the student list's query count does not grow with the
number of rows. Treat the crossing as closed: anything a query inside Academic can
already answer stays inside Academic.

### `rooms`

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Room identifier. |
| `name` | VARCHAR(50), unique | Room name. |
| `capacity` | SMALLINT, default `0` | Seats from `0` to `32767`, matching PostgreSQL `smallint` and `classes.max_students`; the fork used a tinyint. |
| `note` | TEXT, nullable | Free-text note. |
| `status` | SMALLINT, default `0`, indexed | `0` Hoạt động, `1` Tạm khóa, `2` Bảo trì (`RoomStatus`). Only an active room may be assigned. |
| `created_at`, `updated_at` | timestamps | Record lifecycle. |

## Laravel runtime tables

| Table | Purpose |
| --- | --- |
| `password_reset_tokens` | Laravel password reset token storage. |
| `sessions` | Database session storage retained for framework compatibility. |
| `cache`, `cache_locks` | Database cache and locking. |
| `jobs`, `job_batches`, `failed_jobs` | Database queue runtime. |

## System

### `system_settings`

System-wide mutable configuration, owned by `API / System`.

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Setting identifier. |
| `key` | VARCHAR, unique | Stable setting key. |
| `value` | JSONB | Setting value. |
| `description` | TEXT, nullable | Operator-facing explanation. |
| `updated_by` | BIGINT, nullable, FK `users`, null on delete | Last account to update the setting. |
| `created_at`, `updated_at` | timestamptz | Record lifecycle. |

## File Management

Private file metadata and links, owned by `API / FileManagement`. Files have one immutable owner; `file_links` is the only domain-usage reference. There are no folders or generic links.

### `files`

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | File identifier. |
| `owner_user_id` | BIGINT, FK `users`, restrict on delete | Immutable owning account. |
| `original_name`, `display_name` | VARCHAR | Uploaded and user-facing names. |
| `disk`, `path` | VARCHAR, unique together | Storage location. |
| `extension` | VARCHAR(16) | File extension. |
| `mime_type` | VARCHAR(150) | Uploaded MIME type. |
| `size_bytes` | BIGINT | File size. |
| `deleted_at` | timestamptz, nullable | Soft deletion instant. |
| `created_at`, `updated_at` | timestamptz | Record lifecycle. |
| — | index (`owner_user_id`, `deleted_at`, `created_at`) | Owner library listing. |

### `file_links`

| Column | Type / constraints | Notes |
| --- | --- | --- |
| `id` | BIGINT auto-increment primary key | Link identifier. |
| `file_id` | BIGINT, FK `files`, restrict on delete | Referenced file. |
| `type` | SMALLINT | `0` Profile avatar (`FileLinkType`). |
| `foreign_id` | BIGINT | Identifier in the linked domain. |
| `created_at`, `updated_at` | timestamptz | Record lifecycle. |
| — | index (`type`, `foreign_id`) | Lookup by domain target. |
