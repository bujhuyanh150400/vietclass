<?php

namespace App\Modules\Academic\Http\Requests;

use App\Modules\Academic\Enums\ClassroomFacility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreRoomRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may create a room.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated room payload.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', Rule::unique('rooms', 'name')],
            'capacity' => ['required', 'integer', 'min:0', 'max:32767'],
            'location' => ['sometimes', 'nullable', 'string', 'max:500'],
            'facilities' => ['sometimes', 'array'],
            'facilities.*' => ['integer', Rule::in(ClassroomFacility::values())],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
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
            'name.unique' => 'Tên phòng học này đã tồn tại trong hệ thống.',
            'facilities.*.in' => 'Tiện ích được chọn không hợp lệ.',
        ];
    }

    /**
     * Return the requested facilities as the integers the jsonb column stores.
     *
     * A query string or a form post delivers them as strings, and jsonb tells "0"
     * apart from 0, so a room saved from one transport would never match a filter
     * sent through the other. Coercing here is what keeps the two comparable.
     *
     * @return list<int>
     */
    public function facilities(): array
    {
        /** @var array<int, mixed> $facilities */
        $facilities = (array) ($this->validated('facilities') ?? []);

        return array_values(array_map(intval(...), $facilities));
    }

    /**
     * Return the validated payload with facilities reduced to the integers jsonb stores.
     *
     * The controller hands this straight to the Action, so the coercion cannot be
     * forgotten at one call site and silently persist ["0"] instead of [0].
     *
     * @return array<string, mixed>
     */
    public function roomAttributes(): array
    {
        $attributes = $this->validated();

        if (! array_key_exists('facilities', $attributes)) {
            return $attributes;
        }

        return [...$attributes, 'facilities' => $this->facilities()];
    }
}
