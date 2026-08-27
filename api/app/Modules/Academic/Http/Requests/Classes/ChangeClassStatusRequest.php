<?php

namespace App\Modules\Academic\Http\Requests\Classes;

use App\Modules\Academic\Enums\ClassStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ChangeClassStatusRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may end a class.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated class status payload.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'integer', Rule::in(ClassStatus::values())],
        ];
    }

    /**
     * Return the requested state as the enum the Action works with.
     */
    public function status(): ClassStatus
    {
        return ClassStatus::from((int) $this->validated('status'));
    }
}
