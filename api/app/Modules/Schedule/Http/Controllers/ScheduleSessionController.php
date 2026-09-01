<?php

namespace App\Modules\Schedule\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Schedule\Actions\GetScheduleSessionAction;
use App\Modules\Schedule\Actions\ListScheduleSessionsAction;
use App\Modules\Schedule\Actions\ResolveScheduleSessionAction;
use App\Modules\Schedule\Http\Requests\ScheduleSessions\IndexScheduleSessionRequest;
use App\Modules\Schedule\Http\Requests\ScheduleSessions\ResolveScheduleSessionRequest;
use App\Modules\Schedule\Http\Requests\ScheduleSessions\ShowScheduleSessionRequest;
use App\Modules\Schedule\Http\Resources\ScheduleSessionResource;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Support\ProjectedSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ScheduleSessionController extends BaseController
{
    /**
     * Return every session between two dates, the written rows and the projected ones
     * together.
     *
     * The result is a collection rather than a page: the Action fixes the order at date
     * then start time, and paging would cut a calendar into arbitrary pieces — a reader
     * asking for a fortnight wants the fortnight. The range is bounded instead, which is
     * the honest way to keep the answer finite.
     */
    public function index(
        IndexScheduleSessionRequest $request,
        ListScheduleSessionsAction $sessions,
    ): JsonResponse {
        $result = $sessions->handle(
            from: $request->openingDate(),
            to: $request->closingDate(),
            classId: $request->classId(),
            teacherProfileId: $request->teacherProfileId(),
            roomId: $request->roomId(),
            teacherProfileScope: $request->teacherProfileScope(),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var list<ProjectedSession> $calendar */
        $calendar = $result->getData();

        return $this->success(
            data: ScheduleSessionResource::collection($calendar)->resolve($request),
        );
    }

    /**
     * Materialise a projected session into a written one and answer with the row.
     *
     * The answer is `200` and not `201`, on a first call as much as a repeat one. The
     * operation is idempotent and the Action deliberately does not report which of the two
     * happened — both callers asked for this lesson to have a row and both got it — so a
     * status claiming a row was created would be a guess half the time.
     */
    public function resolve(
        ResolveScheduleSessionRequest $request,
        ResolveScheduleSessionAction $resolve,
    ): JsonResponse {
        $result = $resolve->handle(
            templateId: $request->templateId(),
            date: $request->sessionDate(),
            actorId: $this->actorId($request),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ScheduleInstance $session */
        $session = $result->getData();

        return $this->success(data: $this->represent($session, $request));
    }

    /**
     * Return one written session by identifier.
     *
     * Only written sessions are addressable: a projected one has no identifier, so it is
     * read through the calendar and materialised before anything can point at it.
     */
    public function show(
        ShowScheduleSessionRequest $request,
        GetScheduleSessionAction $sessions,
        int $sessionId,
    ): JsonResponse {
        $result = $sessions->handle(
            sessionId: $sessionId,
            teacherProfileScope: $request->teacherProfileScope(),
        );

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var ScheduleInstance $session */
        $session = $result->getData();

        return $this->success(data: $this->represent($session, $request));
    }

    /**
     * Render a written session through the same representation the calendar uses.
     *
     * A lesson reads identically whether it was found in a date range or fetched by its
     * identifier, which is the point of having one shape for both kinds of session: a
     * client that materialises a projected session gets back the very thing it was
     * holding, now with an identifier.
     *
     * @return array<string, mixed>
     */
    private function represent(ScheduleInstance $session, Request $request): array
    {
        return ScheduleSessionResource::make(ProjectedSession::fromInstance($session))->resolve($request);
    }

    /**
     * Return the identifier of the authenticated user, which every write path stamps onto
     * the session as its creator or its last editor.
     */
    private function actorId(Request $request): int
    {
        return (int) $request->user()?->getAuthIdentifier();
    }
}
