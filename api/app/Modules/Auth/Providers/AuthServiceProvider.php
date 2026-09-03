<?php

namespace App\Modules\Auth\Providers;

use App\Modules\Auth\Console\SyncFeaturesCommand;
use App\Modules\Auth\Support\FeatureRegistry;
use App\Modules\Auth\Support\FeatureResolver;
use App\Modules\Identity\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

final class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register module container bindings.
     *
     * Both are singletons: the registry has to collect declarations from every module
     * into one catalogue, and the resolver memoises its answer for the request.
     */
    public function register(): void
    {
        $this->app->singleton(FeatureRegistry::class);
        $this->app->singleton(FeatureResolver::class);
    }

    /**
     * Load the module's authorization hook, console commands, and HTTP entry points.
     */
    public function boot(): void
    {
        $this->configureLoginRateLimiter();
        $this->registerCookieTokenRetrieval();
        $this->registerFeatureGate();
        $this->registerCommands();
        $this->loadApiRoutes();
        $this->loadConsoleRoutes();
    }

    /**
     * Limit login attempts per username and client address.
     */
    private function configureLoginRateLimiter(): void
    {
        RateLimiter::for('auth-login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(
                Str::lower((string) $request->input('username')).'|'.$request->ip(),
            );
        });
    }

    /**
     * Also accept the bearer token from the session cookie, so a browser can authenticate
     * without JavaScript ever being able to read the token.
     *
     * Sanctum calls this callback *instead of* its own header lookup rather than after it
     * (`Guard::getTokenFromRequest`), so the header is read here first and stays the only
     * source for mobile and other non-browser clients.
     */
    private function registerCookieTokenRetrieval(): void
    {
        $cookieName = (string) config('identity.session_cookie');

        Sanctum::getAccessTokenFromRequestUsing(
            function (Request $request) use ($cookieName): ?string {
                $cookie = $request->cookie($cookieName);

                return $request->bearerToken() ?? (is_string($cookie) ? $cookie : null);
            },
        );
    }

    /**
     * Answer every authorization check whose ability is a declared permission code.
     *
     * One `before` callback is used instead of a `Gate::define()` per case so a module
     * may declare its permissions at any point during registration, and so abilities
     * this module does not own fall through to the rest of the gate stack untouched.
     */
    private function registerFeatureGate(): void
    {
        Gate::before(function (User $user, string $ability): ?bool {
            $feature = $this->app->make(FeatureRegistry::class)->find($ability);

            if ($feature === null) {
                return null;
            }

            return $this->app->make(FeatureResolver::class)->allows($user, $feature);
        });
    }

    /**
     * Expose the module's Artisan commands to console processes.
     */
    private function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([SyncFeaturesCommand::class]);
        }
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
