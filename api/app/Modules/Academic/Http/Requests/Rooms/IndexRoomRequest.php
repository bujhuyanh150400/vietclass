<?php

namespace App\Modules\Academic\Http\Requests\Rooms;

use App\Core\Data\ListQuery;
use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Academic\Enums\ClassroomFacility;
use App\Modules\Academic\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexRoomRequest extends FormRequest
{
    // Aliased because the shared builder arrives through a trait, not a parent
    // class, so `parent::toListQuery()` would resolve to nothing.
    use PaginatesQuery {
        toListQuery as sharedListQuery;
    }

    /**
     * Allow the request; route middleware already decided who may list rooms.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted room list query string.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->paginationRules(),
            'status' => ['sometimes', 'integer', Rule::in(RoomStatus::values())],
            'facilities' => ['sometimes', 'array'],
            'facilities.*' => ['integer', Rule::in(ClassroomFacility::values())],
            'capacity_min' => ['sometimes', 'integer', 'min:0', 'max:32767'],
            'capacity_max' => ['sometimes', 'integer', 'min:0', 'max:32767'],
        ];
    }

    /**
     * Return the caller-facing messages for rules whose default wording is unclear.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'facilities.*.in' => 'Tiện ích được lọc không hợp lệ.',
        ];
    }

    /**
     * Return the columns a caller may sort rooms by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'name', 'capacity', 'created_at'];
    }

    /**
     * Return the filters this list accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['status', 'facilities', 'capacity_min', 'capacity_max'];
    }

    /**
     * Build the shared list query, with the facility filter reduced to integers.
     *
     * A query string delivers `facilities[]=0` as the string "0", and jsonb tells "0"
     * apart from 0. Coercing before the value reaches the repository is what stops a
     * filter from silently matching nothing against rooms saved with real integers.
     */
    public function toListQuery(): ListQuery
    {
        $query = $this->sharedListQuery();

        if (! $query->hasFilter('facilities')) {
            return $query;
        }

        /** @var array<int, mixed> $facilities */
        $facilities = (array) $query->filter('facilities');

        return new ListQuery(
            page: $query->page,
            perPage: $query->perPage,
            search: $query->search,
            sort: $query->sort,
            direction: $query->direction,
            filters: [
                ...$query->filters,
                'facilities' => array_values(array_map(intval(...), $facilities)),
            ],
        );
    }
}
