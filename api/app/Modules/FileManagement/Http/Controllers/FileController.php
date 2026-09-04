<?php

namespace App\Modules\FileManagement\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\FileManagement\Actions\GetFileAction;
use App\Modules\FileManagement\Actions\GetFileContentAction;
use App\Modules\FileManagement\Actions\GetFileUsageAction;
use App\Modules\FileManagement\Actions\ListFileOwnerOptionsAction;
use App\Modules\FileManagement\Actions\ListFilesAction;
use App\Modules\FileManagement\Actions\PermanentlyDeleteFileAction;
use App\Modules\FileManagement\Actions\RestoreFileAction;
use App\Modules\FileManagement\Actions\TrashFileAction;
use App\Modules\FileManagement\Actions\UpdateFileAction;
use App\Modules\FileManagement\Actions\UploadFileAction;
use App\Modules\FileManagement\Http\Requests\FileOwnerOptionsRequest;
use App\Modules\FileManagement\Http\Requests\FileUsageRequest;
use App\Modules\FileManagement\Http\Requests\GetFileContentRequest;
use App\Modules\FileManagement\Http\Requests\IndexFileRequest;
use App\Modules\FileManagement\Http\Requests\StoreFileRequest;
use App\Modules\FileManagement\Http\Requests\UpdateFileRequest;
use App\Modules\FileManagement\Http\Resources\FileOwnerOptionResource;
use App\Modules\FileManagement\Http\Resources\FileResource;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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
        $file->load(['owner.profile', 'links']);

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

    /** Return one page of files visible to the authenticated caller. */
    public function index(IndexFileRequest $request, ListFilesAction $files): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $files->handle(actor: $actor, query: $request->toListQuery());

        /** @var LengthAwarePaginator<int, ManagedFile> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, FileResource::class);
    }

    /** Return safe metadata for one file visible to the caller. */
    public function show(Request $request, GetFileAction $file, int $fileId): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $file->handle(actor: $actor, fileId: $fileId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ManagedFile $found */
        $found = $result->getData();

        return $this->success(data: FileResource::make($found)->resolve($request));
    }

    /** Rename one file visible to the caller without accepting storage coordinates. */
    public function update(UpdateFileRequest $request, UpdateFileAction $update, int $fileId): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $update->handle(
            actor: $actor,
            fileId: $fileId,
            displayName: $request->validated('display_name'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ManagedFile $file */
        $file = $result->getData();

        return $this->success(data: FileResource::make($file)->resolve($request));
    }

    /** Redirect authorized content requests to a short-lived private-storage URL. */
    public function content(
        GetFileContentRequest $request,
        GetFileContentAction $content,
        int $fileId,
    ): RedirectResponse|JsonResponse {
        /** @var User $actor */
        $actor = $request->user();
        $result = $content->handle(
            actor: $actor,
            fileId: $fileId,
            download: $request->boolean('download'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return redirect()->away((string) $result->getData())->header('Cache-Control', 'no-store');
    }

    /** Move one active, unlinked visible file into trash while retaining its private object. */
    public function destroy(TrashFileAction $trash, Request $request, int $fileId): Response|JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $trash->handle(actor: $actor, fileId: $fileId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }

    /** Restore one trashed visible file without changing its owner or storage coordinates. */
    public function restore(RestoreFileAction $restore, Request $request, int $fileId): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $result = $restore->handle(actor: $actor, fileId: $fileId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ManagedFile $file */
        $file = $result->getData();

        return $this->success(data: FileResource::make($file)->resolve($request));
    }

    /** Delete a trashed, unlinked visible file's object before removing its metadata. */
    public function permanent(
        PermanentlyDeleteFileAction $delete,
        Request $request,
        int $fileId,
    ): Response|JsonResponse {
        /** @var User $actor */
        $actor = $request->user();
        $result = $delete->handle(actor: $actor, fileId: $fileId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }
}
