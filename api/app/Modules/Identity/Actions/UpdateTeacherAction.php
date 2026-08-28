<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Repositories\ProfileRepository;
use App\Modules\Identity\Repositories\TeacherRepository;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final class UpdateTeacherAction
{
    /** Attributes that belong on the shared profile row. */
    private const PROFILE_KEYS = ['full_name', 'phone', 'email', 'gender', 'address'];

    /** Attributes that belong on the teaching row. */
    private const TEACHER_KEYS = ['status', 'joined_at', 'color_identification'];

    /**
     * Create the action with its profile and teaching collaborators.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
        private readonly ProfileRepository $profiles,
    ) {}

    /**
     * Change a teacher profile.
     *
     * The login name is not part of this operation: it identifies the account across
     * tokens and logs, and the fork treated it as fixed after creation too. Password
     * and account locking each have their own endpoint.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<TeacherProfile, IdentityError>
     */
    public function handle(int $teacherId, array $attributes): ActionResult
    {
        try {
            $teacher = $this->teachers->findById($teacherId);

            if (! $teacher instanceof TeacherProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: IdentityError::TeacherNotFound,
                );
            }

            DB::transaction(function () use ($teacher, $attributes): void {
                $this->profiles->update($teacher->profile, Arr::only($attributes, self::PROFILE_KEYS));
                $this->teachers->update($teacher, Arr::only($attributes, self::TEACHER_KEYS));
            });

            return ActionResult::success($this->teachers->findById($teacherId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
