<?php

namespace App\Modules\Academic\Http\Requests\Concerns;

use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GuardianRelationship;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The `guardians` roster shared by the student create and update requests.
 *
 * A student may be linked to any number of people — a father and a mother, a
 * grandparent who does the school run, a court-appointed guardian — and one of them is
 * the main contact. So the payload carries a list rather than a single guardian, and
 * the two endpoints validate it identically: a roster that is legal to create with is
 * legal to save an edit with, and the rules live in one place rather than drifting
 * between the two requests.
 *
 * Each entry names an existing guardian profile. Contact data belongs to Guardian
 * CRUD, so student forms cannot create, reuse, or silently rewrite profiles.
 *
 * `relationship` is required either way: a link that does not say who the person is to
 * the student records nothing a reader could act on.
 */
trait ValidatesGuardianRoster
{
    /** How many people one student may be linked to in a single payload. */
    private const MAX_GUARDIANS = 10;

    /**
     * Return the per-field rules for the roster.
     *
     * @return array<string, array<int, mixed>>
     */
    protected function guardianRosterRules(): array
    {
        return [
            'guardians' => ['sometimes', 'array', 'max:'.self::MAX_GUARDIANS],
            'guardians.*' => ['array'],
            'guardians.*.guardian_profile_id' => ['required', 'integer', 'distinct', 'min:1'],
            'guardians.*.name' => ['prohibited'],
            'guardians.*.gender' => ['prohibited'],
            'guardians.*.phone' => ['prohibited'],
            'guardians.*.relationship' => ['required', 'integer', Rule::in(GuardianRelationship::values())],
            'guardians.*.is_primary' => ['required', 'boolean'],
        ];
    }

    /**
     * Return the caller-facing messages for the roster rules.
     *
     * @return array<string, string>
     */
    protected function guardianRosterMessages(): array
    {
        return [
            'guardians.max' => 'Một học sinh chỉ liên kết được tối đa '.self::MAX_GUARDIANS.' phụ huynh.',
            'guardians.*.relationship.required' => 'Vui lòng chọn quan hệ của phụ huynh với học sinh.',
            'guardians.*.relationship.in' => 'Quan hệ của phụ huynh với học sinh không hợp lệ.',
        ];
    }

    /** Validate that every non-empty student roster declares one explicit primary. */
    protected function validateGuardianRoster(Validator $validator): void
    {
        /** @var array<int, mixed> $roster */
        $roster = $this->input('guardians', []);
        if (! is_array($roster) || $roster === []) {
            return;
        }

        $primaryCount = 0;
        foreach ($roster as $entry) {
            if (is_array($entry) && filter_var($entry['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $primaryCount++;
            }
        }

        if ($primaryCount !== 1) {
            $validator->errors()->add('guardians', 'Danh sách phụ huynh phải chọn chính xác một liên hệ chính.');
        }
    }
}
