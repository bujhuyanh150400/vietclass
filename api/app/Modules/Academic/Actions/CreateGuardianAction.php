<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Repositories\ProfileRepository;
use App\Modules\Academic\Services\GuardianStudentRoster;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final class CreateGuardianAction
{
    private const PROFILE_KEYS = ['full_name', 'phone', 'email', 'gender', 'address', 'note'];

    /** Create the profile, duplicate checker, and roster collaborators. */
    public function __construct(
        private readonly ProfileRepository $profiles,
        private readonly GuardianStudentRoster $roster,
    ) {}

    /** Create a role-pure guardian and its complete student roster atomically. */
    public function handle(array $attributes): ActionResult
    {
        try {
            $guardian = DB::transaction(function () use ($attributes): Profile {
                $duplicate = $this->profiles->findGuardianDuplicate(
                    phone: (string) $attributes['phone'],
                    name: (string) $attributes['full_name'],
                );
                if ($duplicate instanceof Profile) {
                    throw new ActionError(
                        message: 'Đã có hồ sơ phụ huynh trùng tên và số điện thoại.',
                        code: AcademicPersonError::GuardianDuplicate,
                    );
                }

                $guardian = $this->profiles->create([
                    ...Arr::only($attributes, self::PROFILE_KEYS),
                    'user_id' => null,
                ]);
                $this->roster->sync($guardian, $attributes['students']);

                return $guardian;
            });

            return ActionResult::success($this->profiles->findGuardian((int) $guardian->id));
        } catch (ActionError $error) {
            $meta = [];
            if ($error->code() === AcademicPersonError::GuardianDuplicate) {
                $duplicate = $this->profiles->findGuardianDuplicate(
                    phone: (string) $attributes['phone'],
                    name: (string) $attributes['full_name'],
                );
                $meta = $duplicate instanceof Profile
                    ? ['existing_guardian_id' => $duplicate->id, 'existing_guardian_name' => $duplicate->full_name]
                    : [];
            }

            return ActionResult::error(error: $error->code(), message: $error->getMessage(), meta: $meta);
        }
    }
}
