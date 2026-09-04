<?php

namespace App\Modules\System\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFileQuotasRequest extends FormRequest
{
    /** Allow the request; route middleware already decided who may manage file quotas. */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the complete nonnegative byte limits required for every account role.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'quotas' => ['required', 'array:admin,teacher,student,guardian'],
            'quotas.admin' => ['required', 'integer:strict', 'min:0'],
            'quotas.teacher' => ['required', 'integer:strict', 'min:0'],
            'quotas.student' => ['required', 'integer:strict', 'min:0'],
            'quotas.guardian' => ['required', 'integer:strict', 'min:0'],
        ];
    }
}
