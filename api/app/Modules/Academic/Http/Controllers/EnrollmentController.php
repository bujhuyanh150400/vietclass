<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Academic\Actions\EnrollStudentsAction;
use App\Modules\Academic\Actions\LeaveClassAction;
use App\Modules\Academic\Actions\ListAvailableStudentsAction;
use App\Modules\Academic\Actions\ListEnrollmentsAction;
use App\Modules\Academic\Actions\TransferEnrollmentAction;
use App\Modules\Academic\Actions\UpdateEnrollmentAction;
use App\Modules\Academic\Http\Requests\Enrollments\IndexEnrollmentRequest;
use App\Modules\Academic\Http\Requests\Enrollments\LeaveClassRequest;
use App\Modules\Academic\Http\Requests\Enrollments\StoreEnrollmentRequest;
use App\Modules\Academic\Http\Requests\Enrollments\TransferEnrollmentRequest;
use App\Modules\Academic\Http\Requests\Enrollments\UpdateEnrollmentRequest;
use App\Modules\Academic\Http\Resources\EnrollmentResource;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Identity\Http\Requests\Students\IndexStudentRequest;
use App\Modules\Identity\Http\Resources\StudentResource;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

final class EnrollmentController extends BaseController
{
    /**
     * Return one page of a class roster.
     */
    public function index(
        IndexEnrollmentRequest $request,
        ListEnrollmentsAction $enrollments,
        int $classId,
    ): JsonResponse {
        $result = $enrollments->handle(classId: $classId, query: $request->toListQuery());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var LengthAwarePaginator<int, ClassEnrollment> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, EnrollmentResource::class);
    }

    /**
     * Return the students who may still be added to this class.
     */
    public function available(
        IndexStudentRequest $request,
        ListAvailableStudentsAction $students,
        int $classId,
    ): JsonResponse {
        $result = $students->handle(classId: $classId, query: $request->toListQuery());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var LengthAwarePaginator<int, StudentProfile> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, StudentResource::class);
    }

    /**
     * Enrol one or more students into a class.
     */
    public function store(
        StoreEnrollmentRequest $request,
        EnrollStudentsAction $enroll,
        int $classId,
    ): JsonResponse {
        $result = $enroll->handle(
            classId: $classId,
            studentIds: $request->studentIds(),
            enrolledAt: (string) $request->validated('enrolled_at'),
            note: $request->validated('note'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var list<ClassEnrollment> $created */
        $created = $result->getData();

        return $this->success(
            data: EnrollmentResource::collection($created)->resolve($request),
            status: 201,
        );
    }

    /**
     * Correct the join date, leave date, or note on one enrolment.
     */
    public function update(
        UpdateEnrollmentRequest $request,
        UpdateEnrollmentAction $update,
        int $enrollmentId,
    ): JsonResponse {
        $result = $update->handle(enrollmentId: $enrollmentId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ClassEnrollment $enrollment */
        $enrollment = $result->getData();

        return $this->success(data: EnrollmentResource::make($enrollment)->resolve($request));
    }

    /**
     * Move a student to another class of the same subject.
     */
    public function transfer(
        TransferEnrollmentRequest $request,
        TransferEnrollmentAction $transfer,
        int $enrollmentId,
    ): JsonResponse {
        $result = $transfer->handle(
            enrollmentId: $enrollmentId,
            targetClassId: (int) $request->validated('class_id'),
            leftAt: (string) $request->validated('left_at'),
            note: $request->validated('note'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ClassEnrollment $enrollment */
        $enrollment = $result->getData();

        return $this->success(
            data: EnrollmentResource::make($enrollment)->resolve($request),
            status: 201,
        );
    }

    /**
     * End a student's membership of a class.
     */
    public function leave(
        LeaveClassRequest $request,
        LeaveClassAction $leave,
        int $enrollmentId,
    ): JsonResponse {
        $result = $leave->handle(
            enrollmentId: $enrollmentId,
            leftAt: (string) $request->validated('left_at'),
            reason: (string) $request->validated('reason'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ClassEnrollment $enrollment */
        $enrollment = $result->getData();

        return $this->success(data: EnrollmentResource::make($enrollment)->resolve($request));
    }
}
