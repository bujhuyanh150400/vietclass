<?php

namespace App\Modules\Schedule\Providers;

use App\Modules\Auth\Support\FeatureRegistry;
use App\Modules\Schedule\Enums\ScheduleFeature;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

final class ScheduleServiceProvider extends ServiceProvider
{
    /**
     * Register module container bindings and declare the permissions this module owns.
     */
    public function register(): void
    {
        $this->app->make(FeatureRegistry::class)->register(ScheduleFeature::class);
    }

    /**
     * Load the module's HTTP and console entry points.
     */
    public function boot(): void
    {
        $this->loadApiRoutes();
        $this->loadConsoleRoutes();
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
