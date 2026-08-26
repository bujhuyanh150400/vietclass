<?php

namespace App\Modules\Identity\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

final class IdentityServiceProvider extends ServiceProvider
{
    /**
     * Register module container bindings.
     */
    public function register(): void {}

    /**
     * Load the module's HTTP and console entry points.
     */
    public function boot(): void
    {
        $this->configureLoginRateLimiter();
        $this->loadApiRoutes();
        $this->loadConsoleRoutes();
    }

    /**
     * Limit login attempts per username and client address.
     */
    private function configureLoginRateLimiter(): void
    {
        RateLimiter::for('identity-login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(
                Str::lower((string) $request->input('username')).'|'.$request->ip(),
            );
        });
    }

    /**
     * Register versioned API routes while the route cache is being built.
     */
    private function loadApiRoutes(): void
    {
        if ($this->app->routesAreCached()) {
            return;
        }

        Route::middleware('api')
            ->prefix('api/v1')
            ->as('api.v1.')
            ->group(__DIR__.'/../Routes/api.php');
    }

    /**
     * Register module console routes only for Artisan processes.
     */
    private function loadConsoleRoutes(): void
    {
        if ($this->app->runningInConsole()) {
            require __DIR__.'/../Routes/console.php';
        }
    }
}
