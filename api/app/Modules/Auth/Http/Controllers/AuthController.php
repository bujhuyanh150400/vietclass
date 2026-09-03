<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Core\Http\BaseController;
use App\Modules\Auth\Actions\GetCurrentUserAction;
use App\Modules\Auth\Actions\LoginAction;
use App\Modules\Auth\Actions\LogoutAction;
use App\Modules\Auth\Http\Requests\LoginRequest;
use App\Modules\Auth\Http\Resources\CurrentUserResource;
use App\Modules\Identity\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cookie;
use Laravel\Sanctum\NewAccessToken;

final class AuthController extends BaseController
{
    /**
     * Authenticate credentials and return a fresh bearer token.
     *
     * The same token is also written to an HttpOnly cookie so a browser can authenticate
     * without ever exposing it to JavaScript. Non-browser clients ignore the cookie and
     * send the token from the body as an `Authorization` header.
     */
    public function login(LoginRequest $request, LoginAction $login): JsonResponse
    {
        $result = $login->handle(credentials: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var array{user: User, token: NewAccessToken} $data */
        $data = $result->getData();

        $expiresAt = $data['token']->accessToken->expires_at;

        return $this->success([
            'token' => $data['token']->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $expiresAt,
            'user' => CurrentUserResource::make($data['user'])->resolve($request),
        ])->withCookie(cookie(
            name: (string) config('identity.session_cookie'),
            value: $data['token']->plainTextToken,
            // The cookie dies with the token it carries; path, domain, secure, and
            // SameSite come from the shared session cookie configuration.
            minutes: $expiresAt === null ? 0 : (int) now()->diffInMinutes($expiresAt),
            httpOnly: true,
        ));
    }

    /**
     * Return the user authenticated by the current bearer token.
     */
    public function me(Request $request, GetCurrentUserAction $currentUser): JsonResponse
    {
        $result = $currentUser->handle(user: $request->user());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var User $user */
        $user = $result->getData();

        return $this->success(
            data: CurrentUserResource::make($user)->resolve($request),
        );
    }

    /**
     * Revoke the current bearer token and clear the browser's session cookie.
     */
    public function logout(Request $request, LogoutAction $logout): Response|JsonResponse
    {
        $result = $logout->handle(user: $request->user());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent()->withCookie(
            Cookie::forget((string) config('identity.session_cookie')),
        );
    }
}
