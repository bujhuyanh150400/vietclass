<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Services\FileUploader;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\UserRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

final class UploadFileAction
{
    /** Create the upload action with owner resolution and private storage collaborators. */
    public function __construct(
        private readonly UserRepository $users,
        private readonly FileUploader $uploader,
    ) {}

    /** Resolve the owner and atomically persist one uploaded file. */
    public function handle(User $actor, UploadedFile $upload, ?string $displayName, ?int $ownerUserId): ActionResult
    {
        try {
            $owner = $this->resolveOwner(actor: $actor, requestedOwnerId: $ownerUserId);

            return ActionResult::success(DB::transaction(
                fn (): ManagedFile => $this->uploader->store(
                    owner: $owner,
                    upload: $upload,
                    displayName: $displayName,
                ),
            ));
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
}
