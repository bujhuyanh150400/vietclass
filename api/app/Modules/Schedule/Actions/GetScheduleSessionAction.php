<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleInstanceTeacher;
use App\Modules\Schedule\Repositories\ScheduleInstanceRepository;

final class GetScheduleSessionAction
{
    /**
     * Create the action with the store it reads the session from.
     */
    public function __construct(
        private readonly ScheduleInstanceRepository $instances,
    ) {}

    /**
     * Return one written session by identifier.
     *
     * Only written sessions are reachable here, and that is not a gap: a projected session
     * has no identifier to be addressed by, so it is read through the calendar and
     * materialised before anything can point at it. An identifier that matches nothing is
     * therefore the same answer whether the session never existed or was never written.
     *
     * `$teacherProfileScope` is the caller's read scope, applied for the same reason as on
     * the calendar read: a teacher sees the lessons they are on, in either role. A session
     * outside that scope is reported as not found rather than as forbidden — telling a
     * caller that a lesson exists but is not theirs leaks the lesson.
     *
     * @return ActionResult<ScheduleInstance, ScheduleError>
     */
    public function handle(int $sessionId, ?int $teacherProfileScope = null): ActionResult
    {
        try {
            $session = $this->instances->findById($sessionId);

            if (! $session instanceof ScheduleInstance || ! $this->isVisibleTo($session, $teacherProfileScope)) {
                throw new ActionError(
                    message: 'Không tìm thấy buổi học.',
                    code: ScheduleError::SessionNotFound,
                );
            }

            return ActionResult::success($session);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Report whether a caller under a read scope may see this session.
     *
     * The whole teacher list is read, not the main teacher alone: an assistant is present
     * at the lesson, so the lesson is theirs to see. A caller under no scope sees
     * everything.
     */
    private function isVisibleTo(ScheduleInstance $session, ?int $teacherProfileScope): bool
    {
        if ($teacherProfileScope === null) {
            return true;
        }

        return $session->teachers
            ->contains(
                fn (ScheduleInstanceTeacher $row): bool => (int) $row->teacher_profile_id === $teacherProfileScope,
            );
    }
}
