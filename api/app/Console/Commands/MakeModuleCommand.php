<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;

final class MakeModuleCommand extends Command
{
    /** @var string */
    protected $signature = 'make:module {name : PascalCase module name}';

    /** @var string */
    protected $description = 'Scaffold a modular-monolith module and register its service provider.';

    /**
     * Create the module structure and make its provider discoverable by Laravel.
     */
    public function handle(Filesystem $files): int
    {
        $moduleName = (string) $this->argument('name');

        if (! $this->isValidModuleName($moduleName)) {
            $this->components->error('Tên module phải là PascalCase, chỉ gồm chữ cái và số.');

            return self::FAILURE;
        }

        $modulePath = app_path("Modules/{$moduleName}");

        foreach ($this->moduleDirectories() as $directory) {
            $files->ensureDirectoryExists("{$modulePath}/{$directory}");
        }

        $this->writeFileIfMissing(
            $files,
            "{$modulePath}/Providers/{$moduleName}ServiceProvider.php",
            $this->providerStub($moduleName),
        );
        $this->writeFileIfMissing($files, "{$modulePath}/Routes/api.php", "<?php\n");
        $this->writeFileIfMissing($files, "{$modulePath}/Routes/console.php", "<?php\n");
        $this->registerProvider($files, $moduleName);

        $this->components->info("Module [{$moduleName}] đã sẵn sàng.");

        return self::SUCCESS;
    }

    /**
     * Determine whether the module name can safely become a PHP namespace segment.
     */
    private function isValidModuleName(string $moduleName): bool
    {
        return (bool) preg_match('/^[A-Z][A-Za-z0-9]*$/', $moduleName);
    }

    /**
     * Return every module directory that is part of the architectural convention.
     *
     * @return list<string>
     */
    private function moduleDirectories(): array
    {
        return [
            'Actions',
            'Enums',
            'Models',
            'Repositories',
            'Http/Controllers',
            'Http/Requests',
            'Http/Resources',
            'Http/Middleware',
            'Support',
            'Console',
            'Routes',
            'Providers',
        ];
    }

    /**
     * Create a file only when it does not already exist.
     */
    private function writeFileIfMissing(Filesystem $files, string $path, string $contents): void
    {
        if (! $files->exists($path)) {
            $files->put($path, $contents);
        }
    }

    /**
     * Add the generated provider to Laravel's explicit provider list once.
     */
    private function registerProvider(Filesystem $files, string $moduleName): void
    {
        $providersPath = base_path('bootstrap/providers.php');
        $providerClass = "App\\Modules\\{$moduleName}\\Providers\\{$moduleName}ServiceProvider";
        $providers = $files->get($providersPath);

        if (str_contains($providers, "{$providerClass}::class")) {
            return;
        }

        $updatedProviders = preg_replace(
            '/\n\];\s*$/',
            "\n    \\{$providerClass}::class,\n];\n",
            $providers,
        );

        if (! is_string($updatedProviders)) {
            throw new \RuntimeException('Không thể đăng ký module provider.');
        }

        $files->put($providersPath, $updatedProviders);
    }

    /**
     * Build the module service provider source.
     */
    private function providerStub(string $moduleName): string
    {
        $stub = <<<'PHP'
        <?php

        namespace App\Modules\{{ moduleName }}\Providers;

        use Illuminate\Support\Facades\Route;
        use Illuminate\Support\ServiceProvider;

        final class {{ moduleName }}ServiceProvider extends ServiceProvider
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

        PHP;

        return str_replace('{{ moduleName }}', $moduleName, $stub);
    }
}
