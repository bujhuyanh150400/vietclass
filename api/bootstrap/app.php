<?php

use App\Core\Http\ApiResponseFactory;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReportDuplicates();

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            if ($exception instanceof ValidationException) {
                return ApiResponseFactory::error(
                    message: 'Dữ liệu không hợp lệ.',
                    status: 422,
                    errors: $exception->errors(),
                );
            }

            if ($exception instanceof AuthenticationException) {
                return ApiResponseFactory::error('Chưa xác thực.', 401);
            }

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();

                return ApiResponseFactory::error(
                    message: match ($status) {
                        401 => 'Chưa xác thực.',
                        403 => 'Bạn không có quyền thực hiện thao tác này.',
                        404 => 'Không tìm thấy tài nguyên.',
                        405 => 'Phương thức không được hỗ trợ.',
                        429 => 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                        default => $status >= 500
                            ? 'Đã xảy ra lỗi hệ thống.'
                            : 'Yêu cầu không hợp lệ.',
                    },
                    status: $status,
                );
            }

            return ApiResponseFactory::error('Đã xảy ra lỗi hệ thống.', 500);
        });
    })->create();
