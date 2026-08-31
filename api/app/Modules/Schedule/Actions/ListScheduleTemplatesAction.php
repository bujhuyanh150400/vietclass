<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use App\Modules\Schedule\Support\ScheduleTemplateGuard;
use Illuminate\Database\Eloquent\Collection;

final class ListScheduleTemplatesAction
{
    /**
     * Create the action with its query collaborators.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleTemplateGuard $guard,
    ) {}

    /**
     * Return one class's fixed schedules, ordered by weekday and then start time.
     *
     * Closed schedules are included. A class that moved its Friday slot has two rows
     * for that slot, and hiding the retired one would make the change invisible while
     * sessions taught under it still exist. The result is not paged: a class holds a
     * handful of weekly slots plus whatever history it has accumulated, and paging
     * would break the weekday ordering into arbitrary pieces.
     *
     * A teacher identifier narrows the result to the schedules that person is on,
     * whatever role they hold. That narrowing lives here rather than in middleware
     * because middleware can only answer yes or no, not "these rows and not those".
     *
     * @return ActionResult<Collection<int, ScheduleTemplate>, ScheduleError|AcademicError>
     */
    public function handle(int $classId, ?int $teacherProfileId = null): ActionResult
    {
        try {
            $class = $this->guard->requireClass($classId);

            return ActionResult::success($this->templates->listForClass(
                classId: (int) $class->id,
                teacherProfileId: $teacherProfileId,
            ));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
