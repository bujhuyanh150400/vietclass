<?php

namespace App\Modules\FileManagement\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\FileManagement\Actions\GetFileUsageAction;
use App\Modules\FileManagement\Actions\ListFileOwnerOptionsAction;
use App\Modules\FileManagement\Actions\UploadFileAction;
use App\Modules\FileManagement\Http\Requests\FileOwnerOptionsRequest;
use App\Modules\FileManagement\Http\Requests\FileUsageRequest;
use App\Modules\FileManagement\Http\Requests\StoreFileRequest;
use App\Modules\FileManagement\Http\Resources\FileOwnerOptionResource;
use App\Modules\FileManagement\Http\Resources\FileResource;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;

final class FileController extends BaseController
{
    /** Store one validated upload in the actor's or an administrator-selected owner's library. */
    public function store(StoreFileRequest $request, UploadFileAction $upload): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $upload->handle(
            actor: $actor,
            upload: $request->file('file'),
            displayName: $request->validated('display_name'),
            ownerUserId: $request->validated('owner_user_id'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ManagedFile $file */
        $file = $result->getData();

        return $this->success(
            data: FileResource::make($file)->resolve($request),
            status: 201,
        );
    }

    /** Return quota usage for the actor or an administrator-selected owner. */
    public function usage(FileUsageRequest $request, GetFileUsageAction $usage): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $usage->handle(
            actor: $actor,
            ownerUserId: $request->validated('owner_user_id'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->success(data: $result->getData());
    }

    /** Return administrator-visible accounts that can be selected as file owners. */
    public function ownerOptions(FileOwnerOptionsRequest $request, ListFileOwnerOptionsAction $owners): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $owners->handle(actor: $actor, query: $request->toListQuery());

        /** @var Collection<int, User> $users */
        $users = $result->getData();

        return $this->success(data: FileOwnerOptionResource::collection($users)->resolve($request));
    }
}
