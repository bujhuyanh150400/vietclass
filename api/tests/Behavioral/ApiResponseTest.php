<?php

use App\Core\Data\ActionResult;
use App\Core\Http\ApiResponseFactory;
use App\Core\Http\Concerns\HandleApi;
use App\Modules\Identity\Enums\IdentityError;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

beforeEach(function (): void {
    Route::get('/api/v1/testing/response', function () {
        return app(ApiResponseFactory::class)->success(['status' => 'ok']);
    });

    Route::post('/api/v1/testing/validation', function () {
        throw ValidationException::withMessages([
            'username' => ['Tên đăng nhập không hợp lệ.'],
        ]);
    });

    Route::get('/api/v1/testing/not-found', function () {
        abort(404);
    });

    Route::get('/api/v1/testing/system-error', function () {
        throw new RuntimeException('secret internal detail');
    });

    Route::get('/api/v1/testing/trait-response', function () {
        return (new class
        {
            use HandleApi;

            public function respond(): JsonResponse
            {
                return $this->success(['source' => 'trait']);
            }
        })->respond();
    });

    Route::get('/api/v1/testing/action-failure', function () {
        return (new class
        {
            use HandleApi;

            public function respond(): JsonResponse
            {
                return $this->actionFailure(ActionResult::error(
                    error: IdentityError::InvalidCredentials,
                    message: 'Thông tin đăng nhập không chính xác.',
                ));
            }
        })->respond();
    });
});

test('wraps successful API data in the reusable data envelope', function () {
    $this->getJson('/api/v1/testing/response')
        ->assertSuccessful()
        ->assertExactJson([
            'data' => ['status' => 'ok'],
        ]);
});

test('renders validation exceptions as the standard error envelope', function () {
    $this->postJson('/api/v1/testing/validation')
        ->assertUnprocessable()
        ->assertExactJson([
            'message' => 'Dữ liệu không hợp lệ.',
            'errors' => [
                'username' => ['Tên đăng nhập không hợp lệ.'],
            ],
        ]);
});

test('renders framework not-found exceptions without exposing internals', function () {
    $this->getJson('/api/v1/testing/not-found')
        ->assertNotFound()
        ->assertExactJson([
            'message' => 'Không tìm thấy tài nguyên.',
        ]);
});

test('renders unexpected API exceptions as a generic server error', function () {
    $this->getJson('/api/v1/testing/system-error')
        ->assertServerError()
        ->assertExactJson([
            'message' => 'Đã xảy ra lỗi hệ thống.',
        ])
        ->assertJsonMissing(['secret internal detail']);
});

test('reuses the same success envelope through the HandleApi trait', function () {
    $this->getJson('/api/v1/testing/trait-response')
        ->assertSuccessful()
        ->assertExactJson([
            'data' => ['source' => 'trait'],
        ]);
});

test('maps an action error declaration to its HTTP status', function () {
    $this->getJson('/api/v1/testing/action-failure')
        ->assertUnauthorized()
        ->assertExactJson([
            'message' => 'Thông tin đăng nhập không chính xác.',
        ]);
});
