<?php

namespace App\Modules\Academic\Http\Requests\Subjects;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreSubjectRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may create a subject.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated subject payload.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', Rule::unique('subjects', 'name')],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
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
            'name.unique' => 'Tên môn học này đã tồn tại trong hệ thống.',
        ];
    }
}
