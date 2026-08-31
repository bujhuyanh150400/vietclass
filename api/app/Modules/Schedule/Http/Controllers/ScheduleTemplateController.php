<?php

namespace App\Modules\Schedule\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Schedule\Actions\CloseScheduleTemplateAction;
use App\Modules\Schedule\Actions\CreateScheduleTemplateAction;
use App\Modules\Schedule\Actions\DeleteScheduleTemplateAction;
use App\Modules\Schedule\Actions\ListScheduleTemplatesAction;
use App\Modules\Schedule\Actions\ReviseScheduleTemplateAction;
use App\Modules\Schedule\Actions\SetScheduleTemplateTeachersAction;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\CloseScheduleTemplateRequest;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\IndexScheduleTemplateRequest;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\SetScheduleTemplateTeachersRequest;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\StoreScheduleTemplateRequest;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\UpdateScheduleTemplateRequest;
use App\Modules\Schedule\Http\Resources\ScheduleTemplateResource;
use App\Modules\Schedule\Models\ScheduleTemplate;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class ScheduleTemplateController extends BaseController
{
    /**
     * Return every fixed schedule of one class, including the closed ones.
     *
     * The result is a collection rather than a page: the Action fixes the order at
     * weekday then start time, and paging would cut that order into arbitrary pieces.
     */
    public function index(
        IndexScheduleTemplateRequest $request,
        ListScheduleTemplatesAction $templates,
        int $classId,
    ): JsonResponse {
        $result = $templates->handle(
            classId: $classId,
            teacherProfileId: $request->teacherProfileScope(),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Collection<int, ScheduleTemplate> $schedules */
        $schedules = $result->getData();

        return $this->success(
            data: ScheduleTemplateResource::collection($schedules)->resolve($request),
        );
    }

    /**
     * Open a weekly slot for a class.
     */
    public function store(
        StoreScheduleTemplateRequest $request,
        CreateScheduleTemplateAction $create,
        int $classId,
    ): JsonResponse {
        $result = $create->handle(
            classId: $classId,
            attributes: $request->slotAttributes(),
            teachers: $request->teacherList(),
            actorId: $this->actorId($request),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ScheduleTemplate $template */
        $template = $result->getData();

        return $this->success(
            data: ScheduleTemplateResource::make($template)->resolve($request),
            status: 201,
        );
    }

    /**
     * Revise a fixed schedule by closing the running version and opening a new one.
     *
     * This is the update path, and it answers with the new version rather than the one
     * it replaced: from the effective date onwards the new row is the class's schedule.
     */
    public function update(
        UpdateScheduleTemplateRequest $request,
        ReviseScheduleTemplateAction $revise,
        int $templateId,
    ): JsonResponse {
        $result = $revise->handle(
            templateId: $templateId,
            effectiveDate: $request->effectiveDate(),
            attributes: $request->slotAttributes(),
            teachers: $request->teacherList(),
            actorId: $this->actorId($request),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ScheduleTemplate $template */
        $template = $result->getData();

        return $this->success(data: ScheduleTemplateResource::make($template)->resolve($request));
    }

    /**
     * Replace the whole teacher list of a fixed schedule, leaving the slot itself alone.
     */
    public function setTeachers(
        SetScheduleTemplateTeachersRequest $request,
        SetScheduleTemplateTeachersAction $setTeachers,
        int $templateId,
    ): JsonResponse {
        $result = $setTeachers->handle(
            templateId: $templateId,
            teachers: $request->teacherList(),
            actorId: $this->actorId($request),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ScheduleTemplate $template */
        $template = $result->getData();

        return $this->success(data: ScheduleTemplateResource::make($template)->resolve($request));
    }

    /**
     * Stop a fixed schedule from applying after a given date, without replacing it.
     */
    public function close(
        CloseScheduleTemplateRequest $request,
        CloseScheduleTemplateAction $close,
        int $templateId,
    ): JsonResponse {
        $result = $close->handle(
            templateId: $templateId,
            endDate: $request->endDate(),
            actorId: $this->actorId($request),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ScheduleTemplate $template */
        $template = $result->getData();

        return $this->success(data: ScheduleTemplateResource::make($template)->resolve($request));
    }

    /**
     * Remove a fixed schedule that has not started applying yet.
     */
    public function destroy(DeleteScheduleTemplateAction $delete, int $templateId): Response|JsonResponse
    {
        $result = $delete->handle(templateId: $templateId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }

    /**
     * Return the identifier of the authenticated user, which every write path stamps
     * onto the schedule as its creator or its last editor.
     */
    private function actorId(Request $request): int
    {
        return (int) $request->user()?->getAuthIdentifier();
    }
}
