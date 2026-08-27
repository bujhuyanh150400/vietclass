<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassRepository;
use Illuminate\Database\Eloquent\Collection;

final class ListClassOptionsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Return the classes still running, optionally narrowed to the ones a student may
     * be transferred into: same subject, and never the class being left.
     *
     * @return ActionResult<Collection<int, SchoolClass>, AcademicError>
     */
    public function handle(ListQuery $query, ?int $excludeId = null, ?int $subjectId = null): ActionResult
    {
        return ActionResult::success($this->classes->options($query, $excludeId, $subjectId));
    }
}
