<?php

namespace App\Core\Http;

use Illuminate\Http\JsonResponse;

final class ApiResponseFactory
{
    /**
     * Builds the shared JSON envelope for a successful API response.
     *
     * @param  array<string, mixed>  $meta
     */
    public static function success(mixed $data, int $status = 200, array $meta = []): JsonResponse
    {
        $payload = ['data' => $data];

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    /**
     * Builds the shared JSON envelope for a client-safe API error.
     *
     * @param  array<string, array<int, string>>  $errors
     */
    public static function error(string $message, int $status, array $errors = []): JsonResponse
    {
        $payload = ['message' => $message];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }
}
