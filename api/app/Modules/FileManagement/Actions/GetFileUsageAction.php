<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\UserRepository;
use App\Modules\System\Repositories\SystemSettingRepository;

final class GetFileUsageAction
{
    /** Create the usage action with owner, file, and quota collaborators. */
    public function __construct(
        private readonly UserRepository $users,
        private readonly ManagedFileRepository $files,
        private readonly SystemSettingRepository $settings,
    ) {}

    /** Return the resolved owner's current file usage and applicable quota. */
    public function handle(User $actor, ?int $ownerUserId): ActionResult
    {
        try {
            $owner = $this->resolveOwner(actor: $actor, requestedOwnerId: $ownerUserId);
            $usedBytes = $this->files->usageBytes($owner->id);
            $quotaBytes = $this->settings->fileQuotas()[$this->roleKey($owner->role)];

            return ActionResult::success([
                'owner_id' => $owner->id,
                'used_bytes' => $usedBytes,
                'quota_bytes' => $quotaBytes,
                'remaining_bytes' => max(0, $quotaBytes - $usedBytes),
                'exceeded' => $usedBytes > $quotaBytes,
            ]);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /** Choose an administrator's requested owner or force every other role to itself. */
    private function resolveOwner(User $actor, ?int $requestedOwnerId): User
    {
        $ownerId = $actor->role === UserRole::Admin
            ? ($requestedOwnerId ?? $actor->id)
            : $actor->id;

        return $this->users->findById($ownerId)
            ?? throw new ActionError(
                message: 'Không tìm thấy người sở hữu.',
                code: IdentityError::UserNotFound,
            );
    }

    /** Convert a persisted user role into its system quota key. */
    private function roleKey(UserRole $role): string
    {
        return strtolower($role->name);
    }
}
