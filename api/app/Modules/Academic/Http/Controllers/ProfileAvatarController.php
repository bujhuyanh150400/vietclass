<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Academic\Actions\UpdateProfileAvatarAction;
use App\Modules\Academic\Http\Requests\UpdateProfileAvatarRequest;
use App\Modules\Academic\Http\Resources\AvatarResource;
use App\Modules\Academic\Models\Profile;
use App\Modules\Auth\Models\User;
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
