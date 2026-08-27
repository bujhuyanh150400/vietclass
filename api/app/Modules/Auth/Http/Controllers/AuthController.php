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
use Laravel\Sanctum\NewAccessToken;

final class AuthController extends BaseController
{
    /**
     * Authenticate credentials and return a fresh bearer token.
     */
    public function login(LoginRequest $request, LoginAction $login): JsonResponse
    {
        $result = $login->handle(credentials: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var array{user: User, token: NewAccessToken} $data */
        $data = $result->getData();

        return $this->success([
            'token' => $data['token']->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $data['token']->accessToken->expires_at,
            'user' => CurrentUserResource::make($data['user'])->resolve($request),
        ]);
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
     * Revoke the current bearer token.
     */
    public function logout(Request $request, LogoutAction $logout): Response|JsonResponse
    {
        $result = $logout->handle(user: $request->user());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }
}
