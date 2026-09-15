<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Core\Http\Requests\OptionRequest;
use App\Modules\Academic\Actions\ChangeTeacherPasswordAction;
use App\Modules\Academic\Actions\CreateTeacherAction;
use App\Modules\Academic\Actions\GetTeacherAction;
use App\Modules\Academic\Actions\ListTeacherOptionsAction;
use App\Modules\Academic\Actions\ListTeachersAction;
use App\Modules\Academic\Actions\ToggleTeacherAccountAction;
use App\Modules\Academic\Actions\UpdateTeacherAction;
use App\Modules\Academic\Http\Requests\ChangePasswordRequest;
use App\Modules\Academic\Http\Requests\IndexTeacherRequest;
use App\Modules\Academic\Http\Requests\StoreTeacherRequest;
use App\Modules\Academic\Http\Requests\UpdateTeacherRequest;
use App\Modules\Academic\Http\Requests\ToggleAccountRequest;
use App\Modules\Academic\Http\Resources\TeacherOptionResource;
use App\Modules\Academic\Http\Resources\TeacherResource;
use App\Modules\Academic\Models\TeacherProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class TeacherController extends BaseController
{
    /**
     * Return one page of teacher profiles.
     */
    public function index(IndexTeacherRequest $request, ListTeachersAction $teachers): JsonResponse
    {
        $result = $teachers->handle(query: $request->toListQuery());

        /** @var LengthAwarePaginator<int, TeacherProfile> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, TeacherResource::class);
    }

    /**
     * Return the teachers a class may be assigned to.
     */
    public function options(OptionRequest $request, ListTeacherOptionsAction $options): JsonResponse
    {
        $result = $options->handle(query: $request->toListQuery());

        /** @var Collection<int, TeacherProfile> $teachers */
        $teachers = $result->getData();

        return $this->success(
            data: TeacherOptionResource::collection($teachers)->resolve($request),
        );
    }

    /**
     * Create a teacher profile together with its login account.
     */
    public function store(StoreTeacherRequest $request, CreateTeacherAction $create): JsonResponse
    {
        $result = $create->handle(attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var TeacherProfile $teacher */
        $teacher = $result->getData();

        return $this->success(
            data: TeacherResource::make($teacher)->resolve($request),
            status: 201,
        );
    }

    /**
     * Return one teacher profile.
     */
    public function show(Request $request, GetTeacherAction $teacher, int $teacherId): JsonResponse
    {
        $result = $teacher->handle(teacherId: $teacherId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var TeacherProfile $found */
        $found = $result->getData();

        return $this->success(data: TeacherResource::make($found)->resolve($request));
    }

    /**
     * Change a teacher profile.
     */
    public function update(UpdateTeacherRequest $request, UpdateTeacherAction $update, int $teacherId): JsonResponse
    {
        $result = $update->handle(teacherId: $teacherId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var TeacherProfile $teacher */
        $teacher = $result->getData();

        return $this->success(data: TeacherResource::make($teacher)->resolve($request));
    }

    /**
     * Lock or unlock a teacher's login account.
     */
    public function toggleAccount(
        ToggleAccountRequest $request,
        ToggleTeacherAccountAction $toggle,
        int $teacherId,
    ): JsonResponse {
        $result = $toggle->handle(
            teacherId: $teacherId,
            isActive: $request->boolean('is_active'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var TeacherProfile $teacher */
        $teacher = $result->getData();

        return $this->success(data: TeacherResource::make($teacher)->resolve($request));
    }

    /**
     * Replace the password on a teacher's login account.
     */
    public function changePassword(
        ChangePasswordRequest $request,
        ChangeTeacherPasswordAction $change,
        int $teacherId,
    ): Response|JsonResponse {
        $result = $change->handle(
            teacherId: $teacherId,
            password: (string) $request->validated('password'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }
}
