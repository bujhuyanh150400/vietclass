<?php

namespace App\Modules\Identity\Http\Requests\Concerns;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GuardianRelationship;
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
 * Each entry is one of two shapes, told apart by which keys it carries rather than by
 * a mode flag the caller must keep in step:
 *
 * - `guardian_profile_id` links somebody already on file. It prohibits the free-text
 *   fields, because sending both leaves it ambiguous whether the typed values are
 *   meant to overwrite the stored profile.
 * - `name` with `gender` records somebody new.
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
            'guardians.*.guardian_profile_id' => ['nullable', 'integer', 'min:1'],
            'guardians.*.name' => ['nullable', 'string', 'max:255'],
            'guardians.*.gender' => ['nullable', 'integer', Rule::in(Gender::values())],
            'guardians.*.phone' => ['nullable', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'guardians.*.relationship' => ['required', 'integer', Rule::in(GuardianRelationship::values())],
            'guardians.*.is_primary' => ['sometimes', 'boolean'],
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
            'guardians.*.phone.regex' => 'Số điện thoại phụ huynh không hợp lệ.',
            'guardians.*.relationship.required' => 'Vui lòng chọn quan hệ của phụ huynh với học sinh.',
            'guardians.*.relationship.in' => 'Quan hệ của phụ huynh với học sinh không hợp lệ.',
        ];
    }

    /**
     * Apply the rules that span more than one key of an entry, or more than one entry.
     *
     * These cannot be written as rule strings: `prohibits` and `required_with` do not
     * address a sibling key inside the same wildcard element, so the shape check is
     * done here where both keys of the entry are in hand.
     */
    protected function validateGuardianRoster(Validator $validator): void
    {
        /** @var array<int, mixed> $roster */
        $roster = $this->input('guardians', []);

        if (! is_array($roster)) {
            return;
        }

        $seenProfileIds = [];
        $primaryCount = 0;

        foreach ($roster as $index => $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $profileId = $entry['guardian_profile_id'] ?? null;
            $name = $entry['name'] ?? null;

            if ($profileId !== null && $name !== null) {
                $validator->errors()->add(
                    "guardians.{$index}.guardian_profile_id",
                    'Chọn phụ huynh có sẵn hoặc nhập phụ huynh mới, không gửi cả hai.',
                );
            }

            if ($profileId === null && $name === null) {
                $validator->errors()->add(
                    "guardians.{$index}.name",
                    'Vui lòng chọn một phụ huynh có sẵn hoặc nhập tên phụ huynh mới.',
                );
            }

            if ($profileId === null && $name !== null && ($entry['gender'] ?? null) === null) {
                $validator->errors()->add(
                    "guardians.{$index}.gender",
                    'Vui lòng chọn giới tính phụ huynh.',
                );
            }

            if ($profileId !== null) {
                if (in_array($profileId, $seenProfileIds, strict: true)) {
                    $validator->errors()->add(
                        "guardians.{$index}.guardian_profile_id",
                        'Phụ huynh này đã có trong danh sách của học sinh.',
                    );
                }

                $seenProfileIds[] = $profileId;
            }

            if (filter_var($entry['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $primaryCount++;
            }
        }

        if ($primaryCount > 1) {
            $validator->errors()->add('guardians', 'Chỉ một phụ huynh được đánh dấu là liên hệ chính.');
        }
    }
}
