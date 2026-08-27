<?php

namespace App\Modules\Academic\Http\Requests\Subjects;

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
     * Define the validated subject payload, excluding the locked state, which has its
     * own endpoint because it carries a rule about the classes using the subject.
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
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
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
