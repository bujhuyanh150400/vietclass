<?php

namespace App\Modules\Academic\Services;

use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Repositories\StudentGuardianRepository;
use Illuminate\Database\Eloquent\Collection;

final class GuardianStudentRoster
{
    /** Create the roster writer with its link repository. */
    public function __construct(private readonly StudentGuardianRepository $links) {}

    /** Replace one guardian's complete roster without silently changing primaries. */
    public function sync(Profile $guardian, array $roster, array $replacements = []): void
    {
        $incoming = [];
        foreach ($roster as $entry) {
            $studentId = (int) $entry['student_profile_id'];
            if (isset($incoming[$studentId])) {
                throw new ActionError(
                    message: 'Một học sinh chỉ được xuất hiện một lần trong danh sách.',
                    code: AcademicPersonError::PrimaryGuardianReplacementRequired,
                );
            }

            if (! StudentProfile::query()->whereKey($studentId)->exists()) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh trong danh sách liên kết.',
                    code: AcademicPersonError::StudentNotFound,
                );
            }

            $incoming[$studentId] = [
                'relationship' => GuardianRelationship::from((int) $entry['relationship']),
                'is_primary' => (bool) $entry['is_primary'],
            ];
        }

        $existing = $this->links->forGuardianUpdate((int) $guardian->id);
        $studentIds = array_unique([...$existing->pluck('student_profile_id')->all(), ...array_keys($incoming)]);

        foreach ($studentIds as $studentId) {
            $links = $this->links->forStudentUpdate((int) $studentId);
            $current = $links->firstWhere('guardian_profile_id', $guardian->id);
            $entry = $incoming[(int) $studentId] ?? null;
            $otherLinks = $links->reject(fn ($link): bool => $link->guardian_profile_id === $guardian->id);
            $otherPrimary = $otherLinks->firstWhere('is_primary', true);

            $replacement = null;
            if ($current?->is_primary && (! is_array($entry) || ! $entry['is_primary']) && $otherLinks->isNotEmpty()) {
                $replacementId = (int) ($replacements[$studentId] ?? 0);
                $replacement = $otherLinks->firstWhere('guardian_profile_id', $replacementId);
                if ($replacement === null) {
                    throw new ActionError(
                        message: 'Vui lòng chọn người liên hệ chính thay thế cho học sinh.',
                        code: AcademicPersonError::PrimaryGuardianReplacementRequired,
                    );
                }
            }

            $this->links->clearPrimary((int) $studentId);

            if (is_array($entry)) {
                $this->links->link(
                    studentProfileId: (int) $studentId,
                    guardianProfileId: (int) $guardian->id,
                    relationship: $entry['relationship'],
                );
            } elseif ($current !== null) {
                $this->links->removeLink((int) $studentId, (int) $guardian->id);
            }

            if (is_array($entry) && $entry['is_primary']) {
                $this->links->markPrimary((int) $studentId, (int) $guardian->id);
            } elseif ($replacement !== null) {
                $this->links->markPrimary((int) $studentId, (int) $replacement->guardian_profile_id);
            } elseif ($otherPrimary !== null) {
                $this->links->markPrimary((int) $studentId, (int) $otherPrimary->guardian_profile_id);
            }
        }
    }
}
