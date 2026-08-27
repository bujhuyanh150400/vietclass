<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class SubjectRepository extends BaseRepository
{
    /** This repository is backed by the Subject model. */
    protected function modelClass(): ?string
    {
        return Subject::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of subjects, each carrying the number of running classes that
     * use it, because that count is what blocks locking or removing the subject.
     *
     * @return LengthAwarePaginator<int, Subject>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return $this->modelQuery()
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where('name', 'ilike', $query->searchLike()),
            )
            ->when(
                $query->hasFilter('is_active'),
                fn (Builder $builder): Builder => $builder->where('is_active', $query->filter('is_active')),
            )
            ->withCount([
                'classes as active_classes_count' => fn (Builder $builder): Builder => $builder
                    ->where('status', ClassStatus::Active),
            ])
            ->orderBy($query->sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return the subjects a class may be assigned to, which excludes locked ones.
     *
     * @return Collection<int, Subject>
     */
    public function options(ListQuery $query): Collection
    {
        return $this->modelQuery()
            ->where('is_active', true)
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where('name', 'ilike', $query->searchLike()),
            )
            ->orderBy('name')
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find one subject by identifier, with its running-class count loaded.
     */
    public function findById(int $subjectId): ?Subject
    {
        return $this->modelQuery()
            ->withCount([
                'classes as active_classes_count' => fn (Builder $builder): Builder => $builder
                    ->where('status', ClassStatus::Active),
            ])
            ->find($subjectId);
    }

    /**
     * Persist a new subject.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Subject
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to an existing subject and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Subject $subject, array $attributes): Subject
    {
        $subject->fill($attributes)->save();

        return $subject;
    }

    /**
     * Remove a subject no class references any more.
     */
    public function delete(Subject $subject): void
    {
        $subject->delete();
    }

    /**
     * Count the classes teaching this subject, optionally only those in one state.
     */
    public function countClasses(Subject $subject, ?ClassStatus $status = null): int
    {
        return $subject->classes()
            ->when(
                $status instanceof ClassStatus,
                fn (Builder $builder): Builder => $builder->where('status', $status),
            )
            ->count();
    }
}
