<?php

use Illuminate\Support\Facades\File;

test('it scaffolds a module and registers its provider', function () {
    $moduleName = 'SampleModule';
    $modulePath = app_path("Modules/{$moduleName}");
    $providersPath = base_path('bootstrap/providers.php');
    $originalProviders = File::get($providersPath);

    try {
        $this->artisan('make:module', ['name' => $moduleName])
            ->assertSuccessful();
        $this->artisan('make:module', ['name' => $moduleName])
            ->assertSuccessful();

        expect($modulePath)->toBeDirectory()
            ->and("{$modulePath}/Actions")->toBeDirectory()
            ->and("{$modulePath}/Enums")->toBeDirectory()
            ->and("{$modulePath}/Models")->toBeDirectory()
            ->and("{$modulePath}/Repositories")->toBeDirectory()
            ->and("{$modulePath}/Http/Controllers")->toBeDirectory()
            ->and("{$modulePath}/Http/Requests")->toBeDirectory()
            ->and("{$modulePath}/Http/Resources")->toBeDirectory()
            ->and("{$modulePath}/Http/Middleware")->toBeDirectory()
            ->and("{$modulePath}/Support")->toBeDirectory()
            ->and("{$modulePath}/Console")->toBeDirectory()
            ->and("{$modulePath}/Routes")->toBeDirectory()
            ->and("{$modulePath}/Providers")->toBeDirectory()
            ->and("{$modulePath}/Providers/{$moduleName}ServiceProvider.php")->toBeFile()
            ->and("{$modulePath}/Routes/api.php")->toBeFile()
            ->and("{$modulePath}/Routes/console.php")->toBeFile()
            ->and(File::get($providersPath))->toContain("App\\Modules\\{$moduleName}\\Providers\\{$moduleName}ServiceProvider::class")
            ->and(substr_count(
                File::get($providersPath),
                "App\\Modules\\{$moduleName}\\Providers\\{$moduleName}ServiceProvider::class",
            ))->toBe(1);
    } finally {
        File::deleteDirectory($modulePath);
        File::put($providersPath, $originalProviders);
    }
});
