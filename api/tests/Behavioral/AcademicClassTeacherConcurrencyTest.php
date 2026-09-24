<?php

use App\Modules\Academic\Actions\UpdateClassAction;
use App\Modules\Academic\Actions\UpdateTeacherAction;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\TeacherProfile;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

/** Run one isolated action process with a PostgreSQL application name and JSON result file. */
function forkTeacherOffboardingRaceAction(string $applicationName, string $resultPath, Closure $operation): int
{
    $pid = pcntl_fork();

    if ($pid === 0) {
        try {
            DB::purge();
            DB::selectOne("SELECT set_config('application_name', ?, false)", [$applicationName]);
            file_put_contents($resultPath, json_encode($operation(), JSON_THROW_ON_ERROR));
            exit(0);
        } catch (Throwable $exception) {
            file_put_contents($resultPath, json_encode([
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ], JSON_THROW_ON_ERROR));
            exit(1);
        }
    }

    if ($pid < 0) {
        throw new RuntimeException('Could not fork a teacher offboarding race worker.');
    }

    return $pid;
}

/** Remove fixtures committed for independent PostgreSQL connections and restore the test transaction. */
function cleanTeacherOffboardingRaceFixtures(
    int $classId,
    array $teacherIds,
    array $subjectIds,
    Connection $connection,
): void {
    DB::table('classes')->where('id', $classId)->delete();
    DB::table('subjects')->whereIn('id', $subjectIds)->delete();

    $userIds = DB::table('profiles')->whereIn('id', $teacherIds)->whereNotNull('user_id')->pluck('user_id');
    DB::table('teacher_profiles')->whereIn('profile_id', $teacherIds)->delete();
    DB::table('profiles')->whereIn('id', $teacherIds)->delete();
    DB::table('users')->whereIn('id', $userIds)->delete();
    $connection->beginTransaction();
}

test('class edits serialize teacher assignment before class locks against offboarding', function () {
    if (! function_exists('pcntl_fork')) {
        $this->markTestSkipped('pcntl is required for the PostgreSQL concurrency test.');
    }

    $oldLead = TeacherProfile::factory()->create();
    $departingTeacher = TeacherProfile::factory()->create();
    $class = SchoolClass::factory()->create([
        'teacher_id' => $oldLead->profile_id,
        'grade_level' => GradeLevel::Grade9,
    ]);
    $classId = (int) $class->id;
    $oldLeadId = (int) $oldLead->profile_id;
    $departingTeacherId = (int) $departingTeacher->profile_id;
    $subjectId = (int) $class->subject_id;
    $connection = DB::connection();
    $directory = sys_get_temp_dir().'/vietclass-teacher-race-'.bin2hex(random_bytes(8));
    mkdir($directory);
    $offboardReady = $directory.'/offboard-ready';
    $releaseOffboard = $directory.'/release-offboard';
    $offboardResult = $directory.'/offboard-result.json';
    $classResult = $directory.'/class-result.json';
    $offboardApplication = 'feat15-offboard-'.bin2hex(random_bytes(4));
    $classApplication = 'feat15-class-update-'.bin2hex(random_bytes(4));
    $pids = [];
    $committed = false;

    while ($connection->transactionLevel() > 0) {
        $connection->commit();
    }
    $committed = true;

    try {
        $offboardPid = forkTeacherOffboardingRaceAction(
            applicationName: $offboardApplication,
            resultPath: $offboardResult,
            operation: static function () use ($departingTeacherId, $offboardReady, $releaseOffboard): array {
                TeacherProfile::updating(static function (TeacherProfile $teacher) use ($offboardReady, $releaseOffboard): void {
                    if (! $teacher->isDirty('status')) {
                        return;
                    }

                    touch($offboardReady);
                    $deadline = microtime(true) + 10;
                    while (! is_file($releaseOffboard) && microtime(true) < $deadline) {
                        usleep(10_000);
                    }
                });

                $result = app(UpdateTeacherAction::class)->handle(
                    teacherId: $departingTeacherId,
                    attributes: ['status' => TeacherStatus::Inactive->value],
                );

                return ['success' => $result->isSuccess()];
            },
        );
        $pids[] = $offboardPid;

        $deadline = microtime(true) + 10;
        while (! is_file($offboardReady) && microtime(true) < $deadline) {
            usleep(10_000);
        }
        expect(is_file($offboardReady))->toBeTrue('Offboarding did not reach its post-scan status update.');

        $classPid = forkTeacherOffboardingRaceAction(
            applicationName: $classApplication,
            resultPath: $classResult,
            operation: static function () use ($classId, $departingTeacherId, $class): array {
                $result = app(UpdateClassAction::class)->handle(
                    classId: $classId,
                    attributes: [
                        'name' => $class->name,
                        'subject_id' => $class->subject_id,
                        'teacher_id' => $departingTeacherId,
                        'grade_level' => $class->grade_level->value,
                        'max_students' => $class->max_students,
                    ],
                );

                return [
                    'success' => $result->isSuccess(),
                    'error' => $result->getError()?->value,
                ];
            },
        );
        $pids[] = $classPid;

        $deadline = microtime(true) + 10;
        $classStartedOrFinished = false;
        while (microtime(true) < $deadline) {
            if (is_file($classResult)) {
                $classStartedOrFinished = true;
                break;
            }

            $activity = DB::selectOne(
                'SELECT wait_event_type FROM pg_stat_activity WHERE application_name = ?',
                [$classApplication],
            );
            if (($activity->wait_event_type ?? null) === 'Lock') {
                $classStartedOrFinished = true;
                break;
            }
            usleep(10_000);
        }
        expect($classStartedOrFinished)->toBeTrue('Class update neither completed nor blocked on the teacher lock.');

        touch($releaseOffboard);
        foreach ($pids as $pid) {
            pcntl_waitpid($pid, $status);
            expect(pcntl_wifexited($status) && pcntl_wexitstatus($status) === 0)
                ->toBeTrue('A PostgreSQL concurrency worker failed.');
        }
        $pids = [];

        $offboard = json_decode(file_get_contents($offboardResult), true, flags: JSON_THROW_ON_ERROR);
        $update = json_decode(file_get_contents($classResult), true, flags: JSON_THROW_ON_ERROR);

        expect($offboard['success'])->toBeTrue()
            ->and($update['success'])->toBeFalse()
            ->and(TeacherProfile::query()->findOrFail($departingTeacherId)->status)->toBe(TeacherStatus::Inactive)
            ->and(SchoolClass::query()->findOrFail($classId)->teacher_id)->toBe($oldLeadId);
    } finally {
        touch($releaseOffboard);
        foreach ($pids as $pid) {
            pcntl_waitpid($pid, $status);
        }
        if ($committed) {
            cleanTeacherOffboardingRaceFixtures(
                classId: $classId,
                teacherIds: [$oldLeadId, $departingTeacherId],
                subjectIds: [$subjectId],
                connection: $connection,
            );
        }
        foreach ([$offboardReady, $releaseOffboard, $offboardResult, $classResult] as $path) {
            @unlink($path);
        }
        @rmdir($directory);
    }
});
