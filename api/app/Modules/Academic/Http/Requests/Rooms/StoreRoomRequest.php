<?php

namespace App\Modules\Academic\Http\Requests\Rooms;

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
        ];
    }
}
