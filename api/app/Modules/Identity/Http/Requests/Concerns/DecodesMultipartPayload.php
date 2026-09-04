<?php

namespace App\Modules\Identity\Http\Requests\Concerns;

use JsonException;

trait DecodesMultipartPayload
{
    /** Decode an optional multipart JSON object before the request's normal rules run. */
    protected function prepareForValidation(): void
    {
        if (! $this->exists('payload')) {
            return;
        }

        $raw = (string) $this->input('payload');

        try {
            $decoded = json_decode($raw, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            $decoded = null;
        }

        if (str_starts_with(ltrim($raw), '{') && is_array($decoded)) {
            $this->merge([...$decoded, 'payload' => null]);

            return;
        }

        $this->merge(['payload' => false]);
    }
}
