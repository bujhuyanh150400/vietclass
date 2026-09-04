<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\FileLinkRepository;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\ProfileRepository;
use Illuminate\Support\Facades\DB;

final class UpdateProfileAvatarAction
{
    /** Create the avatar mutation with the profile, file, and link persistence collaborators. */
    public function __construct(
        private readonly ProfileRepository $profiles,
        private readonly ManagedFileRepository $files,
        private readonly FileLinkRepository $links,
    ) {}

    /** Atomically replace one profile avatar after authorizing its account owner or an administrator.
     *
     * @param  array<string, mixed>  $selection
     * @return ActionResult<Profile, IdentityError|FileError>
     */
    public function handle(User $actor, int $profileId, array $selection): ActionResult
    {
        try {
            $profile = DB::transaction(function () use ($actor, $profileId, $selection): Profile {
                $profile = $this->profiles->findForUpdate($profileId)
                    ?? throw new ActionError(
                        message: 'Không tìm thấy hồ sơ.',
                        code: IdentityError::ProfileNotFound,
                    );

                $this->assertMayEdit(actor: $actor, profile: $profile);
                $this->links->deleteForTarget(type: FileLinkType::ProfileAvatar, foreignId: $profile->id);

                if ($selection['type'] === 'file') {
                    $file = $this->files->findActiveForUpdate((int) $selection['file_id']);
                    $this->assertOwnedImage(profile: $profile, file: $file);
                    $this->links->create(
                        fileId: $file->id,
                        type: FileLinkType::ProfileAvatar,
                        foreignId: $profile->id,
                    );
                    $profile->forceFill(['avatar_config' => ['type' => 'file']])->save();
                } else {
                    $profile->forceFill([
                        'avatar_config' => $selection['type'] === 'none' ? null : $selection,
                    ])->save();
                }

                return $profile->refresh()->load('avatarFileLink.file');
            });

            return ActionResult::success($profile);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /** Refuse cross-profile changes even when the broad feature is held. */
    private function assertMayEdit(User $actor, Profile $profile): void
    {
        if ($actor->role !== UserRole::Admin && $profile->user_id !== $actor->id) {
            throw new ActionError(
                message: 'Bạn không có quyền cập nhật hồ sơ này.',
                code: IdentityError::ProfileForbidden,
            );
        }
    }

    /** Ensure the link targets one active image owned by the profile account. */
    private function assertOwnedImage(Profile $profile, ?ManagedFile $file): void
    {
        if (! $file instanceof ManagedFile
            || $profile->user_id === null
            || $file->owner_user_id !== $profile->user_id
            || ! in_array($file->extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            throw new ActionError(
                message: 'Không tìm thấy tệp.',
                code: FileError::NotFound,
            );
        }
    }
}
