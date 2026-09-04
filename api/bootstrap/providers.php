<?php

use App\Modules\Academic\Providers\AcademicServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\FileManagement\Providers\FileManagementServiceProvider;
use App\Modules\Identity\Providers\IdentityServiceProvider;
use App\Providers\AppServiceProvider;

/*
 * Module providers are registered explicitly, in dependency order. Auth owns the
 * permission catalogue every later module declares into, so it stays above them.
 */
return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    IdentityServiceProvider::class,
    FileManagementServiceProvider::class,
    AcademicServiceProvider::class,
];
