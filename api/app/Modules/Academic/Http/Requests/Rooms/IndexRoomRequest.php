<?php

namespace App\Modules\Academic\Http\Requests\Rooms;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Academic\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexRoomRequest extends FormRequest
{
    use PaginatesQuery;

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
        return ['status'];
    }
}
