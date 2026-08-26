<?php

namespace App\Core\Http\Concerns;

use App\Core\Contracts\ErrorDeclarationEnum;
use App\Core\Data\ActionResult;
use App\Core\Http\ApiResponseFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use LogicException;

trait HandleApi
{
    /**
     * Returns a successful response using the application's stable API envelope.
     *
     * @param  array<string, mixed>  $meta
     */
    protected function success(mixed $data, int $status = 200, array $meta = []): JsonResponse
    {
        return ApiResponseFactory::success(
            data: $data,
            status: $status,
            meta: $meta,
        );
    }

    /**
     * Returns a response with no body after a successful destructive operation.
     */
    protected function noContent(): Response
    {
        return response()->noContent();
    }

    /**
     * Returns a client-safe error response for controller-level API failures.
     *
     * @param  array<string, array<int, string>>  $errors
     */
    protected function error(string $message, int $status, array $errors = []): JsonResponse
    {
        return ApiResponseFactory::error(
            message: $message,
            status: $status,
            errors: $errors,
        );
    }

    /**
     * Converts a failed application result into the shared API error envelope.
     *
     * @param  ActionResult<mixed, ErrorDeclarationEnum>  $result
     */
    protected function actionFailure(ActionResult $result): JsonResponse
    {
        if ($result->isSuccess()) {
            throw new LogicException('A successful action result cannot be rendered as a failure.');
        }

        $error = $result->getError();

        if (! $error instanceof ErrorDeclarationEnum) {
            throw new LogicException('A failed action result must carry an error declaration enum.');
        }

        return $this->error(
            message: $result->getMessage() ?? 'Yêu cầu không hợp lệ.',
            status: $error->httpStatus(),
        );
    }
}
