<?php

namespace App\Modules\Academic\Http\Requests\Enrollments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreEnrollmentRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may enrol students.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated payload for adding students to a class.
     *
     * Whether each student may actually join — capacity, opening date, and an existing
     * membership — is decided in the Action, because those are state rules about other
     * records rather than the shape of this one.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'student_ids' => ['required', 'array', 'min:1', 'max:100'],
            'student_ids.*' => ['integer', Rule::exists('student_profiles', 'profile_id')],
            'enrolled_at' => ['required', 'date_format:Y-m-d'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Return the students to enrol, with duplicates in one request collapsed.
     *
     * @return list<int>
     */
    public function studentIds(): array
    {
        /** @var list<int> $ids */
        $ids = (array) $this->validated('student_ids');

        return array_values(array_unique(array_map(intval(...), $ids)));
    }
}
