<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Modules\Academic\Data\EnrollmentHistoryEntry;
use App\Modules\Academic\Enums\ClassEnrollmentEventType;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\ClassEnrollmentEvent;
use App\Modules\Auth\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

final class ClassEnrollmentEventRepository
{
    /**
     * Report whether this student has ever held a period in the requested class.
     */
    public function studentHasClass(int $studentId, int $classId): bool
    {
        return ClassEnrollment::query()
            ->where('student_id', $studentId)
            ->where('class_id', $classId)
            ->exists();
    }

    /**
     * Return a stable, paginated event/legacy timeline and load every resource relation in batches.
     *
     * @return LengthAwarePaginator<int, EnrollmentHistoryEntry>
     */
    public function paginateForStudentClass(int $studentId, int $classId, ListQuery $query): LengthAwarePaginator
    {
        $events = DB::table('class_enrollment_events as events')
            ->join('class_enrollments as periods', 'periods.id', '=', 'events.class_enrollment_id')
            ->where('periods.student_id', $studentId)
            ->where('periods.class_id', $classId)
            ->selectRaw("'event'::text AS kind")
            ->selectRaw('events.id AS id')
            ->selectRaw('events.class_enrollment_id, events.related_enrollment_id, events.actor_id')
            ->selectRaw('events.event_type, events.effective_on, events.note, events.metadata, events.created_at');

        $legacy = DB::table('class_enrollments as periods')
            ->where('periods.student_id', $studentId)
            ->where('periods.class_id', $classId)
            ->whereNotExists(fn (Builder $builder): Builder => $builder
                ->selectRaw('1')
                ->from('class_enrollment_events as events')
                ->whereColumn('events.class_enrollment_id', 'periods.id'))
            ->selectRaw("'legacy_enrollment'::text AS kind")
            ->selectRaw('periods.id AS id')
            ->selectRaw('periods.id AS class_enrollment_id')
            ->selectRaw('NULL::bigint AS related_enrollment_id, NULL::bigint AS actor_id')
            ->selectRaw('NULL::smallint AS event_type')
            ->selectRaw('COALESCE(periods.left_at, periods.enrolled_at) AS effective_on')
            ->selectRaw('periods.note, \'{}\'::jsonb AS metadata, periods.created_at');

        $page = DB::query()
            ->fromSub($events->unionAll($legacy), 'timeline')
            ->select([
                'kind', 'id', 'class_enrollment_id', 'related_enrollment_id', 'actor_id',
                'event_type', 'effective_on', 'note', 'metadata', 'created_at',
            ])
            ->orderBy($query->sort, $query->direction)
            ->orderByRaw("CASE kind WHEN 'event' THEN 0 ELSE 1 END")
            ->orderBy('id', $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);

        $rows = collect($page->items());
        $enrollmentIds = $rows->pluck('class_enrollment_id')
            ->merge($rows->pluck('related_enrollment_id'))
            ->filter()
            ->unique()
            ->values();
        $enrollments = ClassEnrollment::query()
            ->with([
                'schoolClass:id,code,name,grade_level',
                'schoolClass.subjects' => fn ($subjects) => $subjects
                    ->select('subjects.id', 'subjects.name')
                    ->orderBy('subjects.id'),
            ])
            ->whereIn('id', $enrollmentIds)
            ->get()
            ->keyBy('id');
        $actorIds = $rows->pluck('actor_id')->filter()->unique()->values();
        $actors = $actorIds->isEmpty()
            ? collect()
            : User::query()->select(['id', 'username'])->whereIn('id', $actorIds)->get()->keyBy('id');

        $page->setCollection($rows->map(fn (object $row): EnrollmentHistoryEntry => new EnrollmentHistoryEntry(
            kind: (string) $row->kind,
            id: (int) $row->id,
            effectiveOn: CarbonImmutable::parse($row->effective_on)->toDateString(),
            note: $row->note,
            enrollment: $enrollments->get((int) $row->class_enrollment_id),
            relatedEnrollment: $row->related_enrollment_id === null
                ? null
                : $enrollments->get((int) $row->related_enrollment_id),
            eventType: $row->event_type === null ? null : (int) $row->event_type,
            metadata: $row->kind === 'legacy_enrollment'
                ? null
                : (is_array($row->metadata) ? $row->metadata : json_decode($row->metadata, true)),
            createdAt: $row->created_at === null ? null : CarbonImmutable::parse($row->created_at)->toIso8601String(),
            actor: $row->actor_id === null ? null : $actors->get((int) $row->actor_id),
        )));

        return $page;
    }

    /**
     * Append one immutable event for an enrollment period.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function append(
        int $enrollmentId,
        ClassEnrollmentEventType $type,
        CarbonInterface $effectiveOn,
        ?int $actorId = null,
        ?string $note = null,
        array $metadata = [],
        ?int $relatedEnrollmentId = null,
    ): ClassEnrollmentEvent {
        return ClassEnrollmentEvent::query()->create([
            'class_enrollment_id' => $enrollmentId,
            'related_enrollment_id' => $relatedEnrollmentId,
            'actor_id' => $actorId,
            'event_type' => $type,
            'effective_on' => $effectiveOn->toDateString(),
            'note' => $note,
            'metadata' => $metadata,
        ]);
    }
}
