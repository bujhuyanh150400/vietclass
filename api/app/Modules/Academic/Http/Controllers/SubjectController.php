<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Core\Http\Requests\OptionRequest;
use App\Modules\Academic\Actions\CreateSubjectAction;
use App\Modules\Academic\Actions\DeleteSubjectAction;
use App\Modules\Academic\Actions\GetSubjectAction;
use App\Modules\Academic\Actions\ListSubjectOptionsAction;
use App\Modules\Academic\Actions\ListSubjectsAction;
use App\Modules\Academic\Actions\ToggleSubjectActiveAction;
use App\Modules\Academic\Actions\UpdateSubjectAction;
use App\Modules\Academic\Http\Requests\Subjects\IndexSubjectRequest;
use App\Modules\Academic\Http\Requests\Subjects\StoreSubjectRequest;
use App\Modules\Academic\Http\Requests\Subjects\ToggleSubjectActiveRequest;
use App\Modules\Academic\Http\Requests\Subjects\UpdateSubjectRequest;
use App\Modules\Academic\Http\Resources\SubjectOptionResource;
use App\Modules\Academic\Http\Resources\SubjectResource;
use App\Modules\Academic\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class SubjectController extends BaseController
{
    /**
     * Return one page of subjects.
     */
    public function index(IndexSubjectRequest $request, ListSubjectsAction $subjects): JsonResponse
    {
        $result = $subjects->handle(query: $request->toListQuery());

        /** @var LengthAwarePaginator<int, Subject> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, SubjectResource::class);
    }

    /**
     * Return the subjects a class may be assigned to.
     */
    public function options(OptionRequest $request, ListSubjectOptionsAction $options): JsonResponse
    {
        $result = $options->handle(query: $request->toListQuery());

        /** @var Collection<int, Subject> $subjects */
        $subjects = $result->getData();

        return $this->success(
            data: SubjectOptionResource::collection($subjects)->resolve($request),
        );
    }

    /**
     * Create a subject.
     */
    public function store(StoreSubjectRequest $request, CreateSubjectAction $create): JsonResponse
    {
        $result = $create->handle(attributes: $request->validated());

        /** @var Subject $subject */
        $subject = $result->getData();

        return $this->success(
            data: SubjectResource::make($subject)->resolve($request),
            status: 201,
        );
    }

    /**
     * Return one subject.
     */
    public function show(Request $request, GetSubjectAction $subject, int $subjectId): JsonResponse
    {
        $result = $subject->handle(subjectId: $subjectId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Subject $found */
        $found = $result->getData();

        return $this->success(data: SubjectResource::make($found)->resolve($request));
    }

    /**
     * Change a subject's name or description.
     */
    public function update(UpdateSubjectRequest $request, UpdateSubjectAction $update, int $subjectId): JsonResponse
    {
        $result = $update->handle(subjectId: $subjectId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Subject $subject */
        $subject = $result->getData();

        return $this->success(data: SubjectResource::make($subject)->resolve($request));
    }

    /**
     * Lock or unlock a subject for use by new classes.
     */
    public function toggleActive(
        ToggleSubjectActiveRequest $request,
        ToggleSubjectActiveAction $toggle,
        int $subjectId,
    ): JsonResponse {
        $result = $toggle->handle(
            subjectId: $subjectId,
            isActive: $request->boolean('is_active'),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Subject $subject */
        $subject = $result->getData();

        return $this->success(data: SubjectResource::make($subject)->resolve($request));
    }

    /**
     * Remove a subject no class references.
     */
    public function destroy(DeleteSubjectAction $delete, int $subjectId): Response|JsonResponse
    {
        $result = $delete->handle(subjectId: $subjectId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }
}
