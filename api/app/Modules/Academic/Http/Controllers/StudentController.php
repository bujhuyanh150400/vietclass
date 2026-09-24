<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Academic\Actions\ChangeStudentPasswordAction;
use App\Modules\Academic\Actions\CreateStudentAction;
use App\Modules\Academic\Actions\GetStudentAction;
use App\Modules\Academic\Actions\ListEnrollmentHistoryAction;
use App\Modules\Academic\Actions\ListStudentClassesAction;
use App\Modules\Academic\Actions\ListStudentsAction;
use App\Modules\Academic\Actions\ToggleStudentAccountAction;
use App\Modules\Academic\Actions\UpdateStudentAction;
use App\Modules\Academic\Data\EnrollmentHistoryEntry;
use App\Modules\Academic\Http\Requests\ChangePasswordRequest;
use App\Modules\Academic\Http\Requests\IndexEnrollmentHistoryRequest;
use App\Modules\Academic\Http\Requests\IndexStudentClassesRequest;
use App\Modules\Academic\Http\Requests\IndexStudentRequest;
use App\Modules\Academic\Http\Requests\StoreStudentRequest;
use App\Modules\Academic\Http\Requests\ToggleAccountRequest;
use App\Modules\Academic\Http\Requests\UpdateStudentRequest;
use App\Modules\Academic\Http\Resources\EnrollmentHistoryEntryResource;
use App\Modules\Academic\Http\Resources\StudentClassResource;
use App\Modules\Academic\Http\Resources\StudentResource;
use App\Modules\Academic\Models\SchoolClass;
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

    /** Return one page of distinct active and historical classes for the student. */
    public function classes(
        IndexStudentClassesRequest $request,
        ListStudentClassesAction $classes,
        int $studentId,
    ): JsonResponse {
        $result = $classes->handle(studentId: $studentId, query: $request->toListQuery());
        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var LengthAwarePaginator<int, SchoolClass> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, StudentClassResource::class);
    }

    /** Return the requested student's read-only history for one class. */
    public function enrollmentHistory(
        IndexEnrollmentHistoryRequest $request,
        ListEnrollmentHistoryAction $history,
        int $studentId,
    ): JsonResponse {
        $result = $history->handle(
            studentId: $studentId,
            classId: (int) $request->validated('class_id'),
            query: $request->toListQuery(),
        );
        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var LengthAwarePaginator<int, EnrollmentHistoryEntry> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, EnrollmentHistoryEntryResource::class);
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
