<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Academic\Actions\ChangeStudentPasswordAction;
use App\Modules\Academic\Actions\CreateStudentAction;
use App\Modules\Academic\Actions\GetStudentAction;
use App\Modules\Academic\Actions\ListStudentsAction;
use App\Modules\Academic\Actions\ToggleStudentAccountAction;
use App\Modules\Academic\Actions\UpdateStudentAction;
use App\Modules\Academic\Http\Requests\ChangePasswordRequest;
use App\Modules\Academic\Http\Requests\IndexStudentRequest;
use App\Modules\Academic\Http\Requests\StoreStudentRequest;
use App\Modules\Academic\Http\Requests\UpdateStudentRequest;
use App\Modules\Academic\Http\Requests\ToggleAccountRequest;
use App\Modules\Academic\Http\Resources\StudentResource;
use App\Modules\Academic\Models\StudentProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class StudentController extends BaseController
{
    /**
     * Return one page of student profiles.
     */
    public function index(IndexStudentRequest $request, ListStudentsAction $students): JsonResponse
    {
        $result = $students->handle(query: $request->toListQuery());

        /** @var LengthAwarePaginator<int, StudentProfile> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, StudentResource::class);
    }

    /**
     * Create a student profile together with its login account.
     */
    public function store(StoreStudentRequest $request, CreateStudentAction $create): JsonResponse
    {
        $result = $create->handle(attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var StudentProfile $student */
        $student = $result->getData();

        return $this->success(
            data: StudentResource::make($student)->resolve($request),
            status: 201,
        );
    }

    /**
     * Return one student profile.
     */
    public function show(Request $request, GetStudentAction $student, int $studentId): JsonResponse
    {
        $result = $student->handle(studentId: $studentId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var StudentProfile $found */
        $found = $result->getData();

        return $this->success(data: StudentResource::make($found)->resolve($request));
    }

    /**
     * Change a student profile.
     */
    public function update(UpdateStudentRequest $request, UpdateStudentAction $update, int $studentId): JsonResponse
    {
        $result = $update->handle(studentId: $studentId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var StudentProfile $student */
        $student = $result->getData();

        return $this->success(data: StudentResource::make($student)->resolve($request));
    }

    /**
     * Lock or unlock a student's login account.
     */
    public function toggleAccount(
        ToggleAccountRequest $request,
        ToggleStudentAccountAction $toggle,
        int $studentId,
    ): JsonResponse {
        $result = $toggle->handle(
            studentId: $studentId,
            isActive: $request->boolean('is_active'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var StudentProfile $student */
        $student = $result->getData();

        return $this->success(data: StudentResource::make($student)->resolve($request));
    }

    /**
     * Replace the password on a student's login account.
     */
    public function changePassword(
        ChangePasswordRequest $request,
        ChangeStudentPasswordAction $change,
        int $studentId,
    ): Response|JsonResponse {
        $result = $change->handle(
            studentId: $studentId,
            password: (string) $request->validated('password'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }
}
