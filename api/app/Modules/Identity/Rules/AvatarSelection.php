<?php

namespace App\Modules\Identity\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class AvatarSelection implements ValidationRule
{
    private const MAX_BYTES = 16 * 1024;

    /** Validate the persisted avatar union; this endpoint never accepts an uploaded object. */
    public function __construct(private readonly bool $usesUploadedFile = false) {}

    /** Reject every avatar shape and DiceBear option outside the explicit local contract. */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value) || $this->encodedSize($value) > self::MAX_BYTES) {
            $fail('The :attribute is invalid.');

            return;
        }

        match ($value['type'] ?? null) {
            'none' => $this->validateNone($attribute, $value, $fail),
            'file' => $this->validateFile($attribute, $value, $fail),
            'dicebear' => $this->validateDiceBear($attribute, $value, $fail),
            default => $fail('The :attribute type is invalid.'),
        };
    }

    /** Ensure none has no hidden shape fields. */
    private function validateNone(string $attribute, array $value, Closure $fail): void
    {
        if (! $this->hasExactKeys($value, ['type'])) {
            $fail('The :attribute is invalid.');
        }
    }

    /** Ensure file selection carries only a positive existing-file identifier. */
    private function validateFile(string $attribute, array $value, Closure $fail): void
    {
        $keys = $this->usesUploadedFile ? ['type'] : ['type', 'file_id'];

        if (! $this->hasExactKeys($value, $keys)
            || (! $this->usesUploadedFile && (! is_int($value['file_id'] ?? null) || $value['file_id'] < 1))) {
            $fail('The :attribute is invalid.');
        }
    }

    /** Validate the pinned DiceBear style, seed, and scalar-only option surface. */
    private function validateDiceBear(string $attribute, array $value, Closure $fail): void
    {
        if (! $this->hasExactKeys($value, ['type', 'style', 'seed', 'options'])
            || ! is_string($value['style'] ?? null)
            || ! is_string($value['seed'] ?? null)
            || mb_strlen($value['seed']) > 128
            || ! is_array($value['options'] ?? null)) {
            $fail('The :attribute is invalid.');

            return;
        }

        $style = config("avatar.styles.{$value['style']}");

        if (! is_array($style) || ! $this->validOptions($value['options'], $style)) {
            $fail('The :attribute is invalid.');
        }
    }

    /** Check only documented scalar DiceBear controls for the selected style. */
    private function validOptions(array $options, array $style): bool
    {
        foreach ($options as $key => $value) {
            if (! is_string($key) || is_array($value) || is_object($value)) {
                return false;
            }

            if ($key === 'backgroundColor' && $this->hex($value)) {
                continue;
            }

            if ($key === 'flip' && in_array($value, ['none', 'horizontal', 'vertical', 'both'], true)) {
                continue;
            }

            if ($key === 'scale' && $this->integerBetween($value, 0, 10)) {
                continue;
            }

            if (in_array($key, ['rotate'], true) && $this->integerBetween($value, -360, 360)) {
                continue;
            }

            if (in_array($key, ['translateX', 'translateY'], true) && $this->integerBetween($value, -1000, 1000)) {
                continue;
            }

            if ($key === 'borderRadius' && $this->integerBetween($value, 0, 50)) {
                continue;
            }

            if ($this->componentOption($key, $value, $style['components'] ?? [], $style['variants'] ?? [])) {
                continue;
            }

            if ($this->colorOption($key, $value, $style['colors'] ?? [])) {
                continue;
            }

            return false;
        }

        return true;
    }

    /** Validate one component probability or a local style-definition variant name. */
    private function componentOption(string $key, mixed $value, array $components, array $variants): bool
    {
        foreach ($components as $component) {
            if ($key === "{$component}Probability") {
                return $this->integerBetween($value, 0, 100);
            }

            if ($key === "{$component}Variant") {
                return is_string($value)
                    && mb_strlen($value) <= 64
                    && preg_match('/^[a-z][A-Za-z0-9]*$/', $value) === 1
                    && in_array($value, $variants[$component] ?? [], true);
            }
        }

        return false;
    }

    /** Validate one allowed style color control. */
    private function colorOption(string $key, mixed $value, array $colors): bool
    {
        foreach ($colors as $color) {
            if ($key === "{$color}Color") {
                return $this->hex($value);
            }

            if ($key === "{$color}ColorFill") {
                return in_array($value, ['solid', 'linear', 'radial'], true);
            }

            if ($key === "{$color}ColorFillStops") {
                return $this->integerBetween($value, 2, 128);
            }

            if ($key === "{$color}ColorAngle") {
                return $this->integerBetween($value, -360, 360);
            }

            if ($key === "{$color}ColorOrder") {
                return in_array($value, ['random', 'fixed'], true);
            }
        }

        return false;
    }

    /** Keep number validation strict because JSON floats are not editor control values. */
    private function integerBetween(mixed $value, int $min, int $max): bool
    {
        return is_int($value) && $value >= $min && $value <= $max;
    }

    /** Match the unprefixed hexadecimal colors accepted by DiceBear style definitions. */
    private function hex(mixed $value): bool
    {
        return is_string($value) && preg_match('/^#?[0-9a-fA-F]{3,8}$/', $value) === 1;
    }

    /** Count the exact serialized request payload at the trust boundary. */
    private function encodedSize(array $value): int
    {
        $json = json_encode($value);

        return is_string($json) ? strlen($json) : PHP_INT_MAX;
    }

    /** Compare union fields as a set so client JSON property order is irrelevant. */
    private function hasExactKeys(array $value, array $expected): bool
    {
        $keys = array_keys($value);
        sort($keys);
        sort($expected);

        return $keys === $expected;
    }
}
