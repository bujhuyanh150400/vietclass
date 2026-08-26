<?php

namespace App\Core\Data;

/**
 * Carries the immutable outcome of one application operation without coupling it
 * to a transport, request, response, or long-lived runtime state.
 *
 * @template TData
 * @template TError
 */
final readonly class ActionResult
{
    /**
     * Stores one already-classified operation outcome so callers can branch on success
     * before reading the branch-specific payload.
     *
     * @param  TData|null  $data
     * @param  TError|null  $error
     */
    private function __construct(
        private bool $success,
        private mixed $data,
        private mixed $error,
        private ?string $message,
    ) {}

    /**
     * Creates a successful operation outcome with optional data and a caller-facing message.
     *
     * @template TSuccess
     *
     * @param  TSuccess  $data
     * @return ActionResult<TSuccess, never>
     */
    public static function success(mixed $data = null, ?string $message = null): self
    {
        return new self(true, $data, null, $message);
    }

    /**
     * Creates an expected failed operation outcome without throwing it through the runtime.
     *
     * @template TFailure
     *
     * @param  TFailure  $error
     * @return ActionResult<never, TFailure>
     */
    public static function error(mixed $error, ?string $message = null): self
    {
        return new self(false, null, $error, $message);
    }

    /** Reports whether this result carries the successful branch. */
    public function isSuccess(): bool
    {
        return $this->success;
    }

    /**
     * Returns the successful branch payload, or null when this result is an error.
     *
     * @return TData|null
     */
    public function getData(): mixed
    {
        return $this->data;
    }

    /**
     * Returns the expected error payload, or null when this result is successful.
     *
     * @return TError|null
     */
    public function getError(): mixed
    {
        return $this->error;
    }

    /** Returns the optional message supplied by the producing operation. */
    public function getMessage(): ?string
    {
        return $this->message;
    }
}
