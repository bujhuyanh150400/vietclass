<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Core\Http\Requests\OptionRequest;
use App\Modules\Academic\Actions\ChangeClassStatusAction;
use App\Modules\Academic\Actions\CreateClassAction;
use App\Modules\Academic\Actions\GetClassAction;
use App\Modules\Academic\Actions\ListClassesAction;
use App\Modules\Academic\Actions\ListClassOptionsAction;
use App\Modules\Academic\Actions\UpdateClassAction;
use App\Modules\Academic\Http\Requests\Classes\ChangeClassStatusRequest;
use App\Modules\Academic\Http\Requests\Classes\IndexClassRequest;
use App\Modules\Academic\Http\Requests\Classes\StoreClassRequest;
use App\Modules\Academic\Http\Requests\Classes\UpdateClassRequest;
use App\Modules\Academic\Http\Resources\ClassOptionResource;
use App\Modules\Academic\Http\Resources\ClassResource;
use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ClassController extends BaseController
{
    /**
     * Return one page of classes.
     */
    public function index(IndexClassRequest $request, ListClassesAction $classes): JsonResponse
    {
        $result = $classes->handle(query: $request->toListQuery());

        /** @var LengthAwarePaginator<int, SchoolClass> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, ClassResource::class);
    }

    /**
     * Return the classes still running, for a picker.
     */
    public function options(OptionRequest $request, ListClassOptionsAction $options): JsonResponse
    {
        $result = $options->handle(query: $request->toListQuery());

        /** @var Collection<int, SchoolClass> $classes */
        $classes = $result->getData();

        return $this->success(
            data: ClassOptionResource::collection($classes)->resolve($request),
        );
    }

    /**
     * Create a class.
     */
    public function store(StoreClassRequest $request, CreateClassAction $create): JsonResponse
    {
        $result = $create->handle(attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var SchoolClass $class */
        $class = $result->getData();

        return $this->success(
            data: ClassResource::make($class)->resolve($request),
            status: 201,
        );
    }

    /**
     * Return one class.
     */
    public function show(Request $request, GetClassAction $class, int $classId): JsonResponse
    {
        $result = $class->handle(classId: $classId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var SchoolClass $found */
        $found = $result->getData();

        return $this->success(data: ClassResource::make($found)->resolve($request));
    }

    /**
     * Change a class.
     */
    public function update(UpdateClassRequest $request, UpdateClassAction $update, int $classId): JsonResponse
    {
        $result = $update->handle(classId: $classId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var SchoolClass $class */
        $class = $result->getData();

        return $this->success(data: ClassResource::make($class)->resolve($request));
    }

    /**
     * Move a class between the running and finished states.
     */
    public function changeStatus(
        ChangeClassStatusRequest $request,
        ChangeClassStatusAction $change,
        int $classId,
    ): JsonResponse {
        $result = $change->handle(classId: $classId, status: $request->status());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var SchoolClass $class */
        $class = $result->getData();

        return $this->success(data: ClassResource::make($class)->resolve($request));
    }
}
