<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Repositories\ProfileRepository;
use App\Modules\Academic\Repositories\StudentGuardianRepository;
use Illuminate\Support\Facades\DB;

final class DeleteGuardianAction
{
    /** Create the profile and link collaborators. */
    public function __construct(
        private readonly ProfileRepository $profiles,
        private readonly StudentGuardianRepository $links,
    ) {}

    /** Hard-delete one guardian after validating every required replacement. */
    public function handle(int $guardianId, array $replacements = []): ActionResult
    {
        try {
            DB::transaction(function () use ($guardianId, $replacements): void {
                $guardian = $this->profiles->findGuardian($guardianId, lock: true);
                if (! $guardian instanceof Profile) {
                    throw new ActionError(
                        message: 'Không tìm thấy phụ huynh.',
                        code: AcademicPersonError::GuardianNotFound,
                    );
                }

                $guardianLinks = $this->links->forGuardianUpdate($guardianId);
                $replacementIds = [];
                foreach ($guardianLinks as $link) {
                    $studentLinks = $this->links->forStudentUpdate((int) $link->student_profile_id);
                    $others = $studentLinks->reject(fn ($candidate): bool => $candidate->guardian_profile_id === $guardianId);

                    if (! $link->is_primary) {
                        continue;
                    }

                    if ($others->isEmpty()) {
                        continue;
                    }

                    $replacementId = (int) ($replacements[$link->student_profile_id] ?? 0);
                    $replacement = $others->firstWhere('guardian_profile_id', $replacementId);
                    if ($replacement === null || $replacementId === $guardianId) {
                        throw new ActionError(
                            message: 'Vui lòng chọn người liên hệ chính thay thế cho học sinh.',
                            code: AcademicPersonError::PrimaryGuardianReplacementRequired,
                        );
                    }

                    if (! $this->profiles->findGuardian($replacementId) instanceof Profile) {
                        throw new ActionError(
                            message: 'Người thay thế không phải là phụ huynh hợp lệ.',
                            code: AcademicPersonError::GuardianNotFound,
                        );
                    }

                    $replacementIds[(int) $link->student_profile_id] = $replacementId;
                }

                $this->links->removeGuardianLinks($guardianId);
                $guardian->delete();

                foreach ($replacementIds as $studentId => $replacementId) {
                    $this->links->clearPrimary($studentId);
                    $this->links->markPrimary($studentId, $replacementId);
                }
            });

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(error: $error->code(), message: $error->getMessage());
        }
    }
}
