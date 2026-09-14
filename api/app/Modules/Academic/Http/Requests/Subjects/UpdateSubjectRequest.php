<?php

namespace App\Modules\Academic\Http\Requests\Subjects;

use App\Modules\Identity\Enums\GradeLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSubjectRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may change a subject.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated subject payload sent by the editing form.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('subjects', 'name')->ignore($this->route('subject')),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'grade_levels' => ['required', 'array', 'min:1'],
            'grade_levels.*' => ['required', 'integer', 'distinct', Rule::in(GradeLevel::values())],
            'is_active' => ['required', 'boolean'],
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
