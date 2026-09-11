<?php

namespace Database\Seeders;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Seeder;

/**
 * Fill a local database with enough students to review the student list screen.
 *
 * The distribution is chosen rather than random: the screen shows the first two
 * guardians and the first two classes of each student and counts the rest behind a
 * "+N", so a review needs students with none, with exactly the two that fit, and
 * with more than fit. Every count from zero to four therefore appears, alongside a
 * locked account and an enrolment already left, which must stay out of the classes
 * column.
 *
 * Not registered in `DatabaseSeeder`: it writes illustrative people, which is not
 * something `db:seed` should produce by default. Call it explicitly.
 */
final class StudentDemoSeeder extends Seeder
{
    /** The password every demo student shares, so a reviewer can sign in as any of them. */
    private const DEMO_PASSWORD = 'matkhau123';

    /**
     * Seed the subjects, teacher, classes, students, guardians, and enrolments the
     * student list needs, without duplicating anything on a repeated run.
     */
    public function run(): void
    {
        $this->call(AcademicSeeder::class);

        $teacher = $this->demoTeacher();
        $classes = $this->demoClasses($teacher);
        $guardians = $this->demoGuardians();

        foreach ($this->studentPlan() as $index => $plan) {
            $student = $this->demoStudent(index: $index, plan: $plan);

            $this->linkGuardians(
                student: $student,
                guardians: $guardians,
                index: $index,
                count: $plan['guardians'],
            );

            $this->enrol(
                student: $student,
                classes: $classes,
                index: $index,
                count: $plan['classes'],
            );
        }

        $this->lockOneAccount();
        $this->recordOneDepartedEnrolment($classes);
    }

    /**
     * Return the demo students to create, one row per student.
     *
     * `guardians` and `classes` are the counts that make the list's "+N" behaviour
     * visible: both run 0 through 4 across the set, offset from each other so a
     * student with no guardian is not also a student with no class.
     *
     * @return list<array{name: string, gender: Gender, grade: GradeLevel, status: StudentStatus, guardians: int, classes: int}>
     */
    private function studentPlan(): array
    {
        $names = [
            ['Nguyễn Minh Anh', Gender::Female], ['Trần Gia Bảo', Gender::Male],
            ['Lê Ngọc Chi', Gender::Female], ['Phạm Đức Duy', Gender::Male],
            ['Hoàng Khánh Linh', Gender::Female], ['Vũ Tuấn Minh', Gender::Male],
            ['Đặng Bảo Ngọc', Gender::Female], ['Bùi Nhật Nam', Gender::Male],
            ['Đỗ Phương Thảo', Gender::Female], ['Ngô Hải Đăng', Gender::Male],
            ['Dương Thu Trang', Gender::Female], ['Lý Quang Huy', Gender::Male],
            ['Mai Khánh Vy', Gender::Female], ['Trịnh Anh Quân', Gender::Male],
            ['Phan Diệu Hương', Gender::Female], ['Cao Hoàng Long', Gender::Male],
            ['Hồ Mỹ Duyên', Gender::Female], ['Đinh Trọng Nghĩa', Gender::Male],
            ['Tạ Thanh Mai', Gender::Female], ['Lương Việt Anh', Gender::Male],
            ['Chu Hà My', Gender::Female], ['Nguyễn Bá Khoa', Gender::Male],
            ['Trương Lan Nhi', Gender::Female], ['Võ Minh Khang', Gender::Male],
            ['Kiều Thu Hà', Gender::Female],
        ];

        $grades = [
            GradeLevel::Grade6, GradeLevel::Grade7, GradeLevel::Grade8,
            GradeLevel::Grade9, GradeLevel::Grade10, GradeLevel::Grade11,
            GradeLevel::Grade12,
        ];

        $statuses = [StudentStatus::Studying, StudentStatus::Paused, StudentStatus::Stopped];

        $plan = [];

        foreach ($names as $index => [$name, $gender]) {
            $plan[] = [
                'name' => $name,
                'gender' => $gender,
                'grade' => $grades[$index % count($grades)],
                // Weighted towards Studying: a list where a third of the rows have
                // stopped would not look like a real school.
                'status' => $statuses[$index % 7 === 6 ? 2 : ($index % 5 === 4 ? 1 : 0)],
                'guardians' => $index % 5,
                'classes' => ($index + 2) % 5,
            ];
        }

        return $plan;
    }

    /**
     * Return the single teacher the demo classes are assigned to, creating the
     * account and profile behind them only on the first run.
     */
    private function demoTeacher(): TeacherProfile
    {
        $user = User::query()->firstOrCreate(
            ['username' => 'gvdemo01'],
            [
                'password' => self::DEMO_PASSWORD,
                'role' => UserRole::Teacher,
                'is_active' => true,
            ],
        );

        $profile = Profile::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => 'Nguyễn Thu Hà',
                'gender' => Gender::Female,
                'phone' => '0901000001',
            ],
        );

        return TeacherProfile::query()->firstOrCreate(
            ['profile_id' => $profile->id],
            [
                'status' => TeacherStatus::Active,
                'joined_at' => now()->subYears(2)->toDateString(),
            ],
        );
    }

    /**
     * Return the demo classes, keyed by code, creating any that are missing.
     *
     * Codes carry the subject and grade the way a school writes them, because the
     * list shows the code as the class's name and a reviewer has to be able to tell
     * two of them apart at a glance.
     *
     * @return array<string, SchoolClass>
     */
    private function demoClasses(TeacherProfile $teacher): array
    {
        $definitions = [
            ['TOAN9-A', 'Toán 9A', 'Toán', GradeLevel::Grade9],
            ['VAN9-B', 'Ngữ văn 9B', 'Ngữ văn', GradeLevel::Grade9],
            ['ANH9-A', 'Tiếng Anh 9A', 'Tiếng Anh', GradeLevel::Grade9],
            ['LY9-01', 'Vật lý 9-01', 'Vật lý', GradeLevel::Grade9],
            ['HOA9-A', 'Hóa học 9A', 'Hóa học', GradeLevel::Grade9],
            ['TOAN8-A', 'Toán 8A', 'Toán', GradeLevel::Grade8],
            ['VAN8-A', 'Ngữ văn 8A', 'Ngữ văn', GradeLevel::Grade8],
            ['ANH7-A', 'Tiếng Anh 7A', 'Tiếng Anh', GradeLevel::Grade7],
        ];

        $classes = [];

        foreach ($definitions as [$code, $name, $subjectName, $grade]) {
            $subject = Subject::query()->where('name', $subjectName)->firstOrFail();

            $classes[$code] = SchoolClass::query()->firstOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacher->profile_id,
                    'grade_level' => $grade,
                    'max_students' => 30,
                    'status' => ClassStatus::Active,
                    'start_at' => now()->subMonths(3)->toDateString(),
                ],
            );
        }

        return $classes;
    }

    /**
     * Return the pool of guardian profiles the demo students share.
     *
     * Guardians hold no login account, which is what separates them from a student
     * or teacher profile and what makes the phone number safe to match them on.
     *
     * @return list<array{profile: Profile, relationship: GuardianRelationship}>
     */
    private function demoGuardians(): array
    {
        $definitions = [
            ['Nguyễn Thu Hằng', '0902000001', Gender::Female, GuardianRelationship::Mother],
            ['Trần Văn Hùng', '0902000002', Gender::Male, GuardianRelationship::Father],
            ['Lê Thanh Mai', '0902000003', Gender::Female, GuardianRelationship::Mother],
            ['Phạm Minh Đức', '0902000004', Gender::Male, GuardianRelationship::Father],
            ['Hoàng Ngọc Lan', '0902000005', Gender::Female, GuardianRelationship::Other],
            ['Vũ Quốc Anh', '0902000006', Gender::Male, GuardianRelationship::Father],
            ['Đặng Thanh Vân', '0902000007', Gender::Female, GuardianRelationship::Mother],
            ['Bùi Minh Sơn', '0902000008', Gender::Male, GuardianRelationship::Father],
        ];

        $guardians = [];

        foreach ($definitions as [$name, $phone, $gender, $relationship]) {
            $profile = Profile::query()
                ->where('phone', $phone)
                ->whereNull('user_id')
                ->first();

            $guardians[] = [
                'profile' => $profile ?? Profile::query()->create([
                    'full_name' => $name,
                    'phone' => $phone,
                    'gender' => $gender,
                ]),
                'relationship' => $relationship,
            ];
        }

        return $guardians;
    }

    /**
     * Return one demo student, creating the account, shared profile, and student role
     * beneath them only on the first run.
     *
     * @param  array{name: string, gender: Gender, grade: GradeLevel, status: StudentStatus, guardians: int, classes: int}  $plan
     */
    private function demoStudent(int $index, array $plan): StudentProfile
    {
        $username = sprintf('hsdemo%02d', $index + 1);

        $user = User::query()->firstOrCreate(
            ['username' => $username],
            [
                'password' => self::DEMO_PASSWORD,
                'role' => UserRole::Student,
                'is_active' => true,
            ],
        );

        $profile = Profile::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => $plan['name'],
                'gender' => $plan['gender'],
                'phone' => sprintf('09030%05d', $index + 1),
                'dob' => now()->subYears(15)->subDays($index * 11)->toDateString(),
            ],
        );

        return StudentProfile::query()->firstOrCreate(
            ['profile_id' => $profile->id],
            [
                'grade_level' => $plan['grade'],
                'status' => $plan['status'],
            ],
        );
    }

    /**
     * Attach the requested number of guardians to one student, marking the first as
     * the main contact.
     *
     * Guardians are taken from the shared pool at a rotating offset, so siblings
     * genuinely share a guardian profile the way two students entered from two forms
     * with the same phone number would.
     *
     * @param  list<array{profile: Profile, relationship: GuardianRelationship}>  $guardians
     */
    private function linkGuardians(
        StudentProfile $student,
        array $guardians,
        int $index,
        int $count,
    ): void {
        for ($offset = 0; $offset < $count; $offset++) {
            $guardian = $guardians[($index + $offset) % count($guardians)];

            $student->guardianLinks()->updateOrCreate(
                ['guardian_profile_id' => $guardian['profile']->id],
                [
                    'relationship' => $guardian['relationship'],
                    'is_primary' => $offset === 0,
                ],
            );
        }
    }

    /**
     * Enrol one student into the requested number of classes, all of them still
     * running so they appear in the student list's classes column.
     *
     * @param  array<string, SchoolClass>  $classes
     */
    private function enrol(StudentProfile $student, array $classes, int $index, int $count): void
    {
        $codes = array_keys($classes);

        for ($offset = 0; $offset < $count; $offset++) {
            $class = $classes[$codes[($index * 2 + $offset) % count($codes)]];

            ClassEnrollment::query()->firstOrCreate(
                [
                    'class_id' => $class->id,
                    'student_id' => $student->profile_id,
                ],
                [
                    'enrolled_at' => now()->subMonths(2)->toDateString(),
                    'left_at' => null,
                ],
            );
        }
    }

    /**
     * Lock one demo student's account so the list has a row in its locked state.
     */
    private function lockOneAccount(): void
    {
        User::query()
            ->where('username', 'hsdemo16')
            ->update(['is_active' => false]);
    }

    /**
     * Record an enrolment the first demo student has already left.
     *
     * It exists to prove the classes column reports only running enrolments: this
     * class must never appear beside that student, even though the row is there.
     *
     * @param  array<string, SchoolClass>  $classes
     */
    private function recordOneDepartedEnrolment(array $classes): void
    {
        $student = StudentProfile::query()
            ->whereHas('profile.user', fn ($user) => $user->where('username', 'hsdemo01'))
            ->first();

        if (! $student instanceof StudentProfile) {
            return;
        }

        ClassEnrollment::query()->firstOrCreate(
            [
                'class_id' => $classes['ANH7-A']->id,
                'student_id' => $student->profile_id,
            ],
            [
                'enrolled_at' => now()->subYear()->toDateString(),
                'left_at' => now()->subMonths(6)->toDateString(),
                'note' => 'Đã chuyển sang lớp khác.',
            ],
        );
    }
}
