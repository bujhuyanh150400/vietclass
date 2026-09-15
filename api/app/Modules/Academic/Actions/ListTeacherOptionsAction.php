<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Academic\Repositories\TeacherRepository;
use Illuminate\Database\Eloquent\Collection;

final class ListTeacherOptionsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Return the teachers a class may be assigned to.
     *
     * Teachers who have left, or whose account is locked, are excluded here rather
     * than only rejected on submit.
     *
     * @return ActionResult<Collection<int, TeacherProfile>, AcademicPersonError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->teachers->options($query));
    }
}
