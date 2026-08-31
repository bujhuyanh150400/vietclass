<?php

use App\Modules\Academic\Providers\AcademicServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\Identity\Providers\IdentityServiceProvider;
use App\Modules\Schedule\Providers\ScheduleServiceProvider;
use App\Providers\AppServiceProvider;

/*
 * Module providers are registered explicitly, in dependency order. Auth owns the
 * permission catalogue every later module declares into, so it stays above them.
 * Schedule stays below Academic because its schema references Academic's classes
 * and rooms and Identity's teacher profiles.
 */
return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    IdentityServiceProvider::class,
    AcademicServiceProvider::class,
    ScheduleServiceProvider::class,
];
