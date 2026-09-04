<?php

namespace App\Modules\Identity\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Identity\Actions\UpdateProfileAvatarAction;
use App\Modules\Identity\Http\Requests\UpdateProfileAvatarRequest;
use App\Modules\Identity\Http\Resources\AvatarResource;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Http\JsonResponse;

final class ProfileAvatarController extends BaseController
{
    /** Update one profile's independently persisted avatar selection. */
    public function __invoke(
        UpdateProfileAvatarRequest $request,
        UpdateProfileAvatarAction $update,
        int $profile,
    ): JsonResponse {
        /** @var User $actor */
        $actor = $request->user();
        $result = $update->handle(
            actor: $actor,
            profileId: $profile,
            selection: $request->validated('avatar'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Profile $found */
        $found = $result->getData();

        return $this->success(data: $found->avatar_config === null
            ? null
            : AvatarResource::make($found)->resolve($request));
    }
}
