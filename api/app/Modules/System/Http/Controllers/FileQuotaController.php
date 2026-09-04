<?php

namespace App\Modules\System\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Identity\Models\User;
use App\Modules\System\Actions\GetFileQuotasAction;
use App\Modules\System\Actions\UpdateFileQuotasAction;
use App\Modules\System\Http\Requests\UpdateFileQuotasRequest;
use Illuminate\Http\JsonResponse;

final class FileQuotaController extends BaseController
{
    /** Return the configured role quotas for file storage. */
    public function show(GetFileQuotasAction $get): JsonResponse
    {
        return $this->success(data: ['quotas' => $get->handle()->getData()]);
    }

    /** Persist the configured role quotas for file storage. */
    public function update(UpdateFileQuotasRequest $request, UpdateFileQuotasAction $update): JsonResponse
    {
        $validated = $request->validated();

        /** @var User $actor */
        $actor = $request->user();

        return $this->success(data: ['quotas' => $update->handle(
            quotas: $validated['quotas'],
            actor: $actor,
        )->getData()]);
    }
}
