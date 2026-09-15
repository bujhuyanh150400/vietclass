# Database use: PostgreSQL

Last verified: 2026-09-14

    # nguồn sự thật
    - Migrations dưới `api/database/migrations/` là executable source of truth.
    - Schema hiện tại gồm framework runtime, Identity, Auth, Academic, System và File Management.
    - Không có bảng Schedule: module đã bị loại bỏ và schema đang được thiết kế lại.
    - Academic là adaptation có chủ đích của fork, không phải bản sao; các khác biệt được ghi tại nơi liên quan.

# Các bảng mặc định của Laravel

- `password_reset_tokens` — Laravel password reset token storage.
- `sessions` — Database session storage retained for framework compatibility.
- `cache`, `cache_locks` — Database cache and locking.
- `jobs`, `job_batches`, `failed_jobs` — Database queue runtime.
- `personal_access_tokens` — Laravel Sanctum bearer-token storage; chi tiết ở G1.

# Sơ đồ nhóm bảng và phụ thuộc

- G1 – Identity & Profile
    + Phụ thuộc: —
- G2 – Auth & Permissions
    + Phụ thuộc: G1
- G3 – Academic / Học vụ
    + Phụ thuộc: G1
- G4 – System / Hệ thống
    + Phụ thuộc: G1
- G5 – File Management
    + Phụ thuộc: G1

# PostgreSQL extensions

## `unaccent`

    # cài đặt
    - Migration: `2026_09_14_000001_enable_unaccent_extension.php`.
    - Đây là trusted extension từ PostgreSQL 13; ứng dụng cài bằng database user của mình, không cần superuser hay bước provision thủ công.
    - Dictionary bao phủ đầy đủ tiếng Việt, gồm cả `Đ` → `D`.

    # sử dụng
    - Mọi tìm kiếm list và combobox đi qua `BaseRepository::whereAnyUnaccentedLike()` — students, teachers, guardians, classes, subjects, rooms, enrolments, files và account picker.
    - Dùng chung helper để wildcard escaping không bị bỏ sót ở một trong chín call site.

    # index và rollback
    - Chưa có functional index: mọi search dùng `%term%`, leading wildcard loại trừ btree index.
    - Nếu sequential scan không còn đủ nhanh, cần `pg_trgm` GIN index; khi đó `unaccent()` phải được bọc trong hàm `IMMUTABLE` vì bản thân nó là `STABLE`.
    - Xóa extension sẽ làm hỏng mọi query gọi `unaccent()`, nên `down()` chỉ rollback sạch khi các query đó được rollback cùng.

# ---G1: Identity & Profile

    # note
    - Quản lý tài khoản đăng nhập và hồ sơ người dùng.
    - `profiles` là bảng thông tin cá nhân dùng chung; `teacher_profiles` và `student_profiles` là role tables dùng lại `profiles.id`; `student_guardians` lưu quan hệ guardian–student.
    - `teacher_profiles.profile_id` và `student_profiles.profile_id` vừa là primary key của bảng role, vừa là foreign key về `profiles.id`. Cách dùng shared key khiến Academic chỉ có thể trỏ tới profile có đúng role.
    - Guardian không có role table riêng; guardian tồn tại qua row trong `student_guardians` trỏ tới `profiles`.
    - Chỉ `users` và `files` có soft deletion trong các nhóm hiện tại; profile không bị hard-delete trong flow ứng dụng. Foreign key cascade vẫn được giữ cho các đường dẫn xóa trực tiếp.
    - Bank details trên teacher profile và các cột tiền trên Academic đã bị loại bỏ; module sở hữu nghiệp vụ tiền sẽ tự tạo migration của mình.

## users

    # note
    - Quản lý login account. User không hoạt động không thể đăng nhập.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — User identifier.
    - `username` (VARCHAR(50)) — Login identifier.
    - `password` (VARCHAR(255)) — Hashed by the model cast.
    - `remember_token` (VARCHAR(100), nullable) — Laravel remember-token compatibility.
    - `role` (SMALLINT, default `0`) — `0` Admin, `1` Teacher, `2` Student, `3` Guardian (`UserRole`).
    - `is_active` (BOOLEAN, default `true`) — Trạng thái hoạt động.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.
    - `deleted_at` (timestamp, nullable) — Soft deletion.

    # index
    - `unique(username)`.
    - `index(role)`.

## personal_access_tokens

    # note
    - Bảng do Laravel Sanctum cung cấp để lưu bearer-token authentication.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Token identifier.
    - `tokenable_type`, `tokenable_id` (polymorphic relation) — Links a token to a user.
    - `name` (TEXT) — Configured token label.
    - `token` (VARCHAR(64)) — Stored hash, never the plain bearer token.
    - `abilities` (TEXT, nullable) — Sanctum abilities.
    - `last_used_at` (timestamp, nullable) — Last authenticated use.
    - `expires_at` (timestamp, nullable) — Per-token expiration.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `index(tokenable_type, tokenable_id)`.
    - `unique(token)`.
    - `index(expires_at)`.

## profiles

    # note
    - Mỗi teacher, student hoặc guardian là một row; một người có nhiều role vẫn chỉ có một row `profiles`.
    - `metadata` chỉ dành cho raw import data và one-off custom fields. Dữ liệu cần filter, sort, foreign key hoặc validation phải là column riêng.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Profile identifier.
    - `user_id` (BIGINT, nullable, FK `users`) — `NULL` khi không có login account; guardian có thể ở trạng thái này, student luôn có user. Unique constraint tự cung cấp index.
    - `full_name` (VARCHAR(255)) — Display name; collation `vi-VN-x-icu` để `ORDER BY full_name` sắp xếp đúng tiếng Việt.
    - `phone` (VARCHAR(20), nullable) — Không unique; teacher, student và guardian có thể dùng chung số.
    - `email` (VARCHAR(255), nullable) — Không unique.
    - `dob` (DATE, nullable) — Date of birth.
    - `gender` (SMALLINT) — `0` Nam, `1` Nữ, `2` Khác; bắt buộc cả với guardian.
    - `address` (TEXT, nullable) — Postal address.
    - `note` (TEXT, nullable) — Free-text note.
    - `metadata` (JSONB, default `'{}'`) — Raw import data và custom fields tạm thời.
    - `avatar_config` (JSONB, nullable) — Avatar display configuration; file avatar được resolve qua `file_links.type = 0` (`ProfileAvatar`).
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `unique(user_id)`.
    - `index(phone)`.

## teacher_profiles

    # note
    - Teaching role, một row cho mỗi teacher nằm trên row tương ứng trong `profiles`.

    # cấu trúc
    - `profile_id` (BIGINT, primary key, FK `profiles` ON DELETE CASCADE) — Reuses `profiles.id`; không auto-increment.
    - `status` (SMALLINT, default `0`) — `0` Đang làm việc, `1` Đã nghỉ. Chỉ teacher active mới được gán vào class.
    - `joined_at` (DATE) — Start of employment.
    - `color_identification` (VARCHAR(20), nullable) — Calendar colour cho future timetable module; tên mới của `color` trên bảng `teachers` cũ.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `index(status)`.

## student_profiles

    # note
    - Student role, một row cho mỗi student nằm trên row tương ứng trong `profiles`.

    # cấu trúc
    - `profile_id` (BIGINT, primary key, FK `profiles` ON DELETE CASCADE) — Reuses `profiles.id`; không auto-increment.
    - `grade_level` (SMALLINT) — Cùng scale với `classes.grade_level`.
    - `status` (SMALLINT, default `0`) — `0` Đang học, `1` Tạm nghỉ, `2` Dừng hẳn.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `index(grade_level)`.
    - `index(status)`.

## student_guardians

    # note
    - Link many-to-many giữa student và các profile đóng vai trò guardian. Một student có thể có bố và mẹ; một guardian có thể liên kết nhiều student.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Link identifier.
    - `student_profile_id` (BIGINT, FK `student_profiles(profile_id)` ON DELETE CASCADE) — Student.
    - `guardian_profile_id` (BIGINT, FK `profiles(id)` ON DELETE RESTRICT) — Guardian; profile đang được dùng làm guardian không thể bị xóa.
    - `relationship` (SMALLINT) — `0` Bố, `1` Mẹ, `2` Người giám hộ (`GuardianRelationship`). Đổi tên `Other` tại chỗ, không đổi số.
    - `is_primary` (BOOLEAN, default `false`) — Main contact của student.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `index(student_profile_id)`.
    - `index(guardian_profile_id)`.
    - `unique(student_profile_id, guardian_profile_id)`.
    - `unique(student_profile_id) WHERE is_primary` — PostgreSQL partial unique index; mỗi student tối đa một primary contact.

# ---G2: Auth & Permissions

    # note
    - Permission catalogue và per-user overrides.
    - Role defaults nằm trong code qua các module `FeatureEnum`, không nằm trong database. Database chỉ mirror catalogue và lưu exception của từng user.

## features

    # note
    - Owned by `API / Auth`.
    - Rows được ghi bởi `auth:sync-features` và `AuthSeeder` từ registered feature enums; không tự động xóa.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Feature identifier.
    - `code` (VARCHAR(100)) — Stable permission code, ví dụ `subject.create`.
    - `name` (VARCHAR(150)) — Caller-facing name từ enum `label()`.
    - `group_code` (VARCHAR(50)) — Catalogue grouping từ enum `group()`.
    - `description` (TEXT, nullable) — Operator note; sync command không ghi field này.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `unique(code)`.
    - `index(group_code)`.

## feature_user

    # note
    - Owned by `API / Auth`; chỉ lưu exception so với role default.
    - Không có row nghĩa là áp dụng role default.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Override identifier.
    - `user_id` (BIGINT, FK `users` ON DELETE CASCADE) — User bị override.
    - `feature_id` (BIGINT, FK `features` ON DELETE CASCADE) — Permission bị override.
    - `granted` (BOOLEAN, default `true`) — `true` thêm permission; `false` thu hồi permission.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `index(user_id)`.
    - `index(feature_id)`.
    - `unique(user_id, feature_id)`.

    # quy tắc
    - Effective permissions = `defaults(user.role) ∪ granted − denied`, giới hạn ở các code module còn khai báo.
    - User có `is_active = false` không có permission hiệu lực; bearer token cấp trước đó vẫn hợp lệ tới khi hết hạn.

# ---G3: Academic / Học vụ

    # note
    - Quản lý subject, class, enrolment và teaching room.
    - `classes.teacher_id` trỏ tới `teacher_profiles(profile_id)` và `class_enrollments.student_id` trỏ tới `student_profiles(profile_id)`, nên database không cho gán profile thiếu role tương ứng.
    - `rooms` là resource độc lập, không tham chiếu bảng khác; chỉ được xóa khi không còn reference.
    - Không có soft deletion: class kết thúc bằng `status`, enrolment kết thúc bằng `left_at`, room bị hard-delete khi không còn reference.
    - `classes` và `class_enrollments` không có cột tiền. Các cột fee cũ đã bị loại bỏ; module tài chính tương lai sẽ sở hữu migration riêng.

## subjects

    # note
    - Quản lý môn học. Inactive subject không thể gán cho class mới.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Subject identifier.
    - `name` (VARCHAR(50)) — Subject name; fork từng chỉ enforce uniqueness ở service layer.
    - `description` (TEXT, nullable) — Free-text description, API giới hạn 500 characters.
    - `grade_levels` (JSONB, default `'[]'`) — Mảng số đã validate và sort, grade hỗ trợ `0`–`12`.
    - `is_active` (BOOLEAN, default `true`) — Trạng thái hoạt động.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `unique(name)`.
    - `index(is_active)`.
    - GIN `jsonb_path_ops` index trên `grade_levels`, phục vụ subject-list grade filter.

## classes

    # note
    - Quản lý lớp học; `code` immutable sau khi tạo.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Class identifier.
    - `code` (VARCHAR(50)) — Immutable class code.
    - `name` (VARCHAR(50)) — Display name.
    - `subject_id` (BIGINT, FK `subjects`) — Subject taught.
    - `teacher_id` (BIGINT, FK `teacher_profiles(profile_id)`) — Teacher responsible; chỉ profile có teaching role.
    - `grade_level` (SMALLINT) — `0` pre-primary, `1`–`12` grade number.
    - `max_students` (SMALLINT, default `0`) — Places từ `1` tới `32767`; PostgreSQL không có unsigned integer, nên Form Request cap theo signed `smallint`. Fork dùng tinyint và cap ở 255.
    - `status` (SMALLINT, default `0`) — `0` Đang hoạt động, `1` Kết thúc.
    - `start_at` (DATE) — Opening date, immutable sau khi tạo.
    - `end_at` (DATE, nullable) — Closing date.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `unique(code)`.
    - `index(subject_id)`.
    - `index(teacher_id)`.
    - `index(grade_level)`.
    - `index(status)`.

## class_enrollments

    # note
    - Một period student membership trong class. Student rời rồi quay lại sẽ có nhiều row cho cùng class.
    - Active khi `left_at IS NULL OR left_at > today`; tối đa một active row cho mỗi class/student. Vì phụ thuộc ngày hiện tại, rule này được enforce ở application chứ không thể dùng index predicate.
    - `ClassEnrollment::active()` là định nghĩa duy nhất được dùng bởi capacity counts, duplicate checks, rosters và student list.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Enrolment identifier.
    - `class_id` (BIGINT, FK `classes`) — Class joined.
    - `student_id` (BIGINT, FK `student_profiles(profile_id)`) — Student enrolled; chỉ profile có student role.
    - `enrolled_at` (DATE) — Join date; không trước `classes.start_at`.
    - `left_at` (DATE, nullable) — Leave date; `NULL` khi còn enrolled.
    - `note` (TEXT, nullable) — Free-text note.
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `index(class_id)`.
    - `index(student_id)`.
    - `index(class_id, student_id)` — Không unique để giữ lịch sử re-enrolment.

    # quan hệ đặc biệt
    - `StudentProfile::activeEnrollments()` (Identity) là relation `HasMany` duy nhất đi ngược vào Academic, để student list hiển thị các class đang học.
    - Các dependency còn lại chạy Academic → Identity: `classes.teacher_id`, `class_enrollments.student_id`, `ClassEnrollment` → `StudentProfile`, repository query `StudentProfile`, và `EnrollmentController` render `StudentResource`.
    - `StudentResource` được dùng ở sáu call site; relation đi theo model nên không cần truyền dữ liệu thủ công qua từng endpoint.
    - `paginated()` nhận resource class name và tự gọi `$resourceClass::collection(...)`; không có seam để inject per-item data.
    - Thiếu eager load chỉ ảnh hưởng query count, không ảnh hưởng correctness; `IdentityStudentTest` pin query count để student list không tăng theo số row.

## rooms

    # note
    - Quản lý phòng học; chỉ room active mới được assign.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Room identifier.
    - `name` (VARCHAR(50)) — Room name.
    - `capacity` (SMALLINT, default `0`) — Seats từ `0` tới `32767`, cùng giới hạn với `classes.max_students`; fork dùng tinyint.
    - `location` (TEXT, nullable) — Free-text location, search cùng `name`.
    - `facilities` (JSONB, not null, default `'[]'`) — JSON array của `ClassroomFacility` integers `0`–`9`.
    - `note` (TEXT, nullable) — Free-text note.
    - `status` (SMALLINT, default `0`) — `0` Hoạt động, `1` Tạm khóa, `2` Bảo trì (`RoomStatus`).
    - `created_at`, `updated_at` (timestamps) — Record lifecycle.

    # index
    - `unique(name)`.
    - `index(status)`.
    - GIN index `rooms_facilities_gin_index` trên `facilities jsonb_path_ops`, phục vụ facility filter.

    # quy tắc facilities
    - `facilities` lưu integers, không lưu enum names; `ClassroomFacility` là int-backed với values bắt đầu từ `0`.
    - Các case: `0` Máy chiếu, `1` Điều hòa, `2` Máy tính, `3` Tivi thông minh, `4` Loa, `5` Micro, `6` Bảng trắng, `7` Bảng thông minh, `8` Thiết bị thí nghiệm, `9` Wifi.
    - Filter dùng `facilities @> '[…]'::jsonb` nên room phải chứa **mọi** facility được yêu cầu. `jsonb_path_ops` nhỏ hơn `jsonb_ops` vì chỉ dùng containment.
    - `jsonb` phân biệt `0` và `"0"`; `IndexRoomRequest` và request store/update đều coerce input về `int`. `AcademicRoomTest` pin flow save bằng JSON body và filter bằng query string.

# ---G4: System / Hệ thống

## system_settings

    # note
    - Mutable system-wide configuration, owned by `API / System`.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Setting identifier.
    - `key` (VARCHAR) — Stable setting key.
    - `value` (JSONB) — Setting value.
    - `description` (TEXT, nullable) — Operator-facing explanation.
    - `updated_by` (BIGINT, nullable, FK `users` ON DELETE SET NULL) — Last account to update setting.
    - `created_at`, `updated_at` (timestamptz) — Record lifecycle.

    # index
    - `unique(key)`.

# ---G5: File Management

    # note
    - Private file metadata và domain links, owned by `API / FileManagement`.
    - Mỗi file có một immutable owner; `file_links` là reference duy nhất tới domain usage.
    - Không có folders hoặc generic links.

## files

    # note
    - Private file metadata, một file có một immutable owner.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — File identifier.
    - `owner_user_id` (BIGINT, FK `users` ON DELETE RESTRICT) — Immutable owning account.
    - `original_name`, `display_name` (VARCHAR) — Uploaded và user-facing names.
    - `disk`, `path` (VARCHAR) — Storage location.
    - `extension` (VARCHAR(16)) — File extension.
    - `mime_type` (VARCHAR(150)) — Uploaded MIME type.
    - `size_bytes` (BIGINT) — File size.
    - `deleted_at` (timestamptz, nullable) — Soft deletion instant.
    - `created_at`, `updated_at` (timestamptz) — Record lifecycle.

    # index
    - `unique(disk, path)`.
    - `index(owner_user_id, deleted_at, created_at)` — Owner library listing.

## file_links

    # note
    - Domain-usage reference của file; hiện tại type `0` dùng cho profile avatar.

    # cấu trúc
    - `id` (BIGINT auto-increment primary key) — Link identifier.
    - `file_id` (BIGINT, FK `files` ON DELETE RESTRICT) — Referenced file.
    - `type` (SMALLINT) — `0` Profile avatar (`FileLinkType`).
    - `foreign_id` (BIGINT) — Identifier trong linked domain.
    - `created_at`, `updated_at` (timestamptz) — Record lifecycle.

    # index
    - `index(type, foreign_id)` — Lookup theo domain target.
