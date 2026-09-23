<?php

namespace App\Modules\Academic\Http\Middleware;

use App\Modules\Auth\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RejectTeacherGuardianMutation
{
    /** Reject every guardian mutation surface for Teacher accounts before feature grants are checked. */
    public function handle(Request $request, Closure $next): Response
    {
        abort_if(
            $request->user()?->role === UserRole::Teacher,
            403,
            'Bạn không có quyền thực hiện thao tác này.',
        );

        return $next($request);
    }
}
