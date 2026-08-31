<?php

namespace App\Modules\Academic\Http\Requests\Rooms;

use App\Modules\Academic\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ChangeRoomStatusRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may change room status.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated room availability payload.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'integer', Rule::in(RoomStatus::values())],
        ];
    }

    /**
     * Return the requested availability state as the enum the Action works with.
     */
    public function status(): RoomStatus
    {
        return RoomStatus::from((int) $this->validated('status'));
    }
}
