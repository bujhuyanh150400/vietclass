<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Core\Http\Requests\OptionRequest;
use App\Modules\Academic\Actions\CreateGuardianAction;
use App\Modules\Academic\Actions\DeleteGuardianAction;
use App\Modules\Academic\Actions\GetGuardianAction;
use App\Modules\Academic\Actions\ListGuardianOptionsAction;
use App\Modules\Academic\Actions\ListGuardiansAction;
use App\Modules\Academic\Actions\UpdateGuardianAction;
use App\Modules\Academic\Http\Requests\DeleteGuardianRequest;
use App\Modules\Academic\Http\Requests\IndexGuardianRequest;
use App\Modules\Academic\Http\Requests\StoreGuardianRequest;
use App\Modules\Academic\Http\Requests\UpdateGuardianRequest;
use App\Modules\Academic\Http\Resources\GuardianOptionResource;
use App\Modules\Academic\Http\Resources\GuardianResource;
use App\Modules\Academic\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class GuardianController extends BaseController
{
    /** Return a paginated page of every role-pure guardian. */
    public function index(IndexGuardianRequest $request, ListGuardiansAction $guardians): JsonResponse
    {
        $result = $guardians->handle(query: $request->toListQuery());
        /** @var LengthAwarePaginator<int, Profile> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, GuardianResource::class);
    }

    /** Create a guardian profile and complete student roster. */
    public function store(StoreGuardianRequest $request, CreateGuardianAction $create): JsonResponse
    {
        $result = $create->handle(attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->success(data: GuardianResource::make($result->getData())->resolve($request), status: 201);
    }

    /** Return one role-pure guardian and every linked student. */
    public function show(Request $request, GetGuardianAction $guardian, int $guardianId): JsonResponse
    {
        $result = $guardian->handle(guardianId: $guardianId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->success(data: GuardianResource::make($result->getData())->resolve($request));
    }

    /** Replace a guardian profile and its complete student roster. */
    public function update(UpdateGuardianRequest $request, UpdateGuardianAction $update, int $guardianId): JsonResponse
    {
        $result = $update->handle(guardianId: $guardianId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->success(data: GuardianResource::make($result->getData())->resolve($request));
    }

    /** Delete a guardian profile and its links after replacement validation. */
    public function destroy(DeleteGuardianRequest $request, DeleteGuardianAction $delete, int $guardianId): Response|JsonResponse
    {
        $result = $delete->handle(guardianId: $guardianId, replacements: $request->validated('replacements', []));

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }

    /** Return the existing guardian options available to student mutation forms. */
    public function options(OptionRequest $request, ListGuardianOptionsAction $options): JsonResponse
    {
        $result = $options->handle(query: $request->toListQuery());
        /** @var Collection<int, Profile> $guardians */
        $guardians = $result->getData();

        return $this->success(data: GuardianOptionResource::collection($guardians)->resolve($request));
    }
}
