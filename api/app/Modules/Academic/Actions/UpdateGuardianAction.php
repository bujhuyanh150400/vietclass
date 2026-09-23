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

final class UpdateGuardianAction
{
    private const PROFILE_KEYS = ['full_name', 'phone', 'email', 'gender', 'address', 'note'];

    /** Create the profile and roster collaborators. */
    public function __construct(
        private readonly ProfileRepository $profiles,
        private readonly GuardianStudentRoster $roster,
    ) {}

    /** Replace a guardian profile and complete roster in one transaction. */
    public function handle(int $guardianId, array $attributes): ActionResult
    {
        try {
            DB::transaction(function () use ($guardianId, $attributes): void {
                $guardian = $this->profiles->findGuardian($guardianId, lock: true);
                if (! $guardian instanceof Profile) {
                    throw new ActionError(
                        message: 'Không tìm thấy phụ huynh.',
                        code: AcademicPersonError::GuardianNotFound,
                    );
                }

                $duplicate = $this->profiles->findGuardianDuplicate(
                    phone: (string) $attributes['phone'],
                    name: (string) $attributes['full_name'],
                    exceptId: $guardianId,
                );
                if ($duplicate instanceof Profile) {
                    throw new ActionError(
                        message: 'Đã có hồ sơ phụ huynh trùng tên và số điện thoại.',
                        code: AcademicPersonError::GuardianDuplicate,
                    );
                }

                $this->profiles->update($guardian, Arr::only($attributes, self::PROFILE_KEYS));
                $this->roster->sync(
                    guardian: $guardian,
                    roster: $attributes['students'],
                    replacements: $attributes['replacements'] ?? [],
                );
            });

            return ActionResult::success($this->profiles->findGuardian($guardianId));
        } catch (ActionError $error) {
            $meta = [];
            if ($error->code() === AcademicPersonError::GuardianDuplicate) {
                $duplicate = $this->profiles->findGuardianDuplicate(
                    phone: (string) $attributes['phone'],
                    name: (string) $attributes['full_name'],
                    exceptId: $guardianId,
                );
                $meta = $duplicate instanceof Profile
                    ? ['existing_guardian_id' => $duplicate->id, 'existing_guardian_name' => $duplicate->full_name]
                    : [];
            }

            return ActionResult::error(error: $error->code(), message: $error->getMessage(), meta: $meta);
        }
    }
}
