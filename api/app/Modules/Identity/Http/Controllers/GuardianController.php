<?php

namespace App\Modules\Identity\Http\Controllers;

use App\Core\Http\BaseController;
use App\Core\Http\Requests\OptionRequest;
use App\Modules\Identity\Actions\ListGuardianOptionsAction;
use App\Modules\Identity\Http\Resources\GuardianOptionResource;
use App\Modules\Identity\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;

final class GuardianController extends BaseController
{
    /**
     * Return the guardians already on file that a student may be linked to.
     */
    public function options(OptionRequest $request, ListGuardianOptionsAction $options): JsonResponse
    {
        $result = $options->handle(query: $request->toListQuery());

        /** @var Collection<int, Profile> $guardians */
        $guardians = $result->getData();

        return $this->success(
            data: GuardianOptionResource::collection($guardians)->resolve($request),
        );
    }
}
