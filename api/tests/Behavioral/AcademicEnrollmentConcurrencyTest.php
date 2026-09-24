<?php

use App\Modules\Academic\Actions\EnrollStudentsAction;
use App\Modules\Academic\Actions\TransferEnrollmentAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Models\Subject;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

/**
 * Run independent application actions on separate PostgreSQL connections at one start signal.
 *
 * @param  list<Closure(): mixed>  $operations
 * @return list<array<string, mixed>>
 */
function runAcademicActionsConcurrently(array $operations): array
{
    if (! function_exists('pcntl_fork')) {
        throw new RuntimeException('pcntl is required for PostgreSQL concurrency verification.');
    }

    $children = [];
    $resultFiles = [];
    $sockets = [];

    try {
        foreach ($operations as $operation) {
            $resultFile = tempnam(sys_get_temp_dir(), 'vietclass-concurrency-');
            $resultFiles[] = $resultFile;
            $pair = stream_socket_pair(STREAM_PF_UNIX, STREAM_SOCK_STREAM, 0);
            $pid = pcntl_fork();

            if ($pid === 0) {
                fclose($pair[0]);
                try {
                    fread($pair[1], 1);
                    DB::purge();
                    $result = $operation();
                    $error = $result->getError();
                    file_put_contents($resultFile, json_encode([
                        'success' => $result->isSuccess(),
                        'error' => $error instanceof AcademicError ? $error->value : null,
                    ], JSON_THROW_ON_ERROR));
                    exit(0);
                } catch (Throwable $exception) {
                    file_put_contents($resultFile, json_encode([
                        'exception' => $exception::class,
                        'message' => $exception->getMessage(),
                    ], JSON_THROW_ON_ERROR));
                    exit(1);
                }
            }

            if ($pid < 0) {
                throw new RuntimeException('Could not fork a PostgreSQL concurrency worker.');
            }

            fclose($pair[1]);
            $children[] = ['pid' => $pid, 'result_file' => $resultFile];
            $sockets[] = $pair[0];
        }

        foreach ($sockets as $socket) {
            fwrite($socket, 'x');
            fclose($socket);
        }
        $sockets = [];

        foreach ($children as $child) {
            $deadline = microtime(true) + 10;
            do {
                $finished = pcntl_waitpid($child['pid'], $status, WNOHANG);
                if ($finished === $child['pid']) {
                    break;
                }
                usleep(10_000);
            } while (microtime(true) < $deadline);

            if ($finished !== $child['pid']) {
                pcntl_kill($child['pid'], SIGKILL);
                pcntl_waitpid($child['pid'], $status);
                throw new RuntimeException('Concurrent action did not finish within ten seconds.');
            }

            if (! pcntl_wifexited($status) || pcntl_wexitstatus($status) !== 0) {
                $error = file_get_contents($child['result_file']);
                throw new RuntimeException('Concurrency worker failed: '.$error);
            }
        }

        return array_map(
            static fn (array $child): array => json_decode(
                file_get_contents($child['result_file']),
                true,
                flags: JSON_THROW_ON_ERROR,
            ),
            $children,
        );
    } finally {
        foreach ($sockets as $socket) {
            if (is_resource($socket)) {
                fclose($socket);
            }
        }
        foreach ($resultFiles as $resultFile) {
            @unlink($resultFile);
        }
    }
}

test('concurrent enrollment requests cannot claim the last seat twice', function () {
    if (! function_exists('pcntl_fork')) {
        $this->markTestSkipped('pcntl is required for the PostgreSQL concurrency test.');
    }

    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 1,
    ]);
    $students = StudentProfile::factory()->count(2)->create(['grade_level' => GradeLevel::Grade9]);
    $classId = (int) $class->id;
    $studentIds = $students->pluck('profile_id')->map(static fn ($id): int => (int) $id)->all();
    $connection = DB::connection();

    while ($connection->transactionLevel() > 0) {
        $connection->commit();
    }

    try {
        $results = runAcademicActionsConcurrently(array_map(
            static fn (int $studentId) => fn () => app(EnrollStudentsAction::class)->handle(
                classId: $classId,
                studentIds: [$studentId],
                enrolledAt: now()->toDateString(),
            ),
            $studentIds,
        ));

        expect(collect($results)->where('success', true)->count())->toBe(1)
            ->and(collect($results)->where('error', AcademicError::ClassFull->value)->count())->toBe(1)
            ->and(DB::table('class_enrollments')->where('class_id', $classId)->count())->toBe(1)
            ->and(DB::table('class_enrollment_events')->count())->toBe(1);
    } finally {
        cleanCommittedConcurrencyData(
            classIds: [$classId],
            subjectIds: [(int) $class->subject_id],
            teacherIds: [(int) $class->teacher_id],
            studentIds: $studentIds,
            connection: $connection,
        );
    }
});

test('opposing transfers finish without deadlock or exceeding either class capacity', function () {
    if (! function_exists('pcntl_fork')) {
        $this->markTestSkipped('pcntl is required for the PostgreSQL concurrency test.');
    }

    $subject = Subject::factory()->create();
    $classes = collect([
        SchoolClass::factory()->create([
            'subject_id' => $subject->id,
            'grade_level' => GradeLevel::Grade9,
            'max_students' => 2,
        ]),
        SchoolClass::factory()->create([
            'subject_id' => $subject->id,
            'grade_level' => GradeLevel::Grade9,
            'max_students' => 2,
        ]),
    ]);
    $students = StudentProfile::factory()->count(2)->create(['grade_level' => GradeLevel::Grade9]);
    $enrollments = collect([
        ClassEnrollment::factory()->create([
            'class_id' => $classes[0]->id,
            'student_id' => $students[0]->profile_id,
        ]),
        ClassEnrollment::factory()->create([
            'class_id' => $classes[1]->id,
            'student_id' => $students[1]->profile_id,
        ]),
    ]);
    $classIds = $classes->pluck('id')->map(static fn ($id): int => (int) $id)->all();
    $connection = DB::connection();

    while ($connection->transactionLevel() > 0) {
        $connection->commit();
    }

    try {
        $results = runAcademicActionsConcurrently([
            fn () => app(TransferEnrollmentAction::class)->handle(
                enrollmentId: (int) $enrollments[0]->id,
                targetClassId: (int) $classes[1]->id,
                leftAt: now()->toDateString(),
            ),
            fn () => app(TransferEnrollmentAction::class)->handle(
                enrollmentId: (int) $enrollments[1]->id,
                targetClassId: (int) $classes[0]->id,
                leftAt: now()->toDateString(),
            ),
        ]);

        expect(collect($results)->where('success', true)->count())->toBe(2)
            ->and(DB::table('class_enrollments')->whereIn('class_id', $classIds)->count())->toBe(4)
            ->and(DB::table('class_enrollment_events')->count())->toBe(4)
            ->and(DB::table('class_enrollments')->whereIn('class_id', $classIds)->whereNull('left_at')->count())->toBe(2);
    } finally {
        cleanCommittedConcurrencyData(
            classIds: $classIds,
            subjectIds: [(int) $subject->id],
            teacherIds: $classes->map(static fn (SchoolClass $class): int => (int) $class->teacher_id)->all(),
            studentIds: $students->pluck('profile_id')->map(static fn ($id): int => (int) $id)->all(),
            connection: $connection,
        );
    }
});

/** Remove committed test fixtures and restore the test's outer rollback transaction. */
function cleanCommittedConcurrencyData(
    array $classIds,
    array $subjectIds,
    array $teacherIds,
    array $studentIds,
    Connection $connection,
): void {
    $enrollmentIds = DB::table('class_enrollments')->whereIn('class_id', $classIds)->pluck('id');
    DB::statement('ALTER TABLE class_enrollment_events DISABLE TRIGGER class_enrollment_events_immutable');
    DB::table('class_enrollment_events')->whereIn('class_enrollment_id', $enrollmentIds)->delete();
    DB::statement('ALTER TABLE class_enrollment_events ENABLE TRIGGER class_enrollment_events_immutable');
    DB::table('class_enrollments')->whereIn('class_id', $classIds)->delete();

    $profileIds = [...$teacherIds, ...$studentIds];
    $userIds = DB::table('profiles')->whereIn('id', $profileIds)->pluck('user_id')->filter();

    DB::table('classes')->whereIn('id', $classIds)->delete();
    DB::table('subjects')->whereIn('id', $subjectIds)->delete();
    DB::table('teacher_profiles')->whereIn('profile_id', $teacherIds)->delete();
    DB::table('student_profiles')->whereIn('profile_id', $studentIds)->delete();
    DB::table('profiles')->whereIn('id', $profileIds)->delete();
    DB::table('users')->whereIn('id', $userIds)->delete();
    $connection->beginTransaction();
}
