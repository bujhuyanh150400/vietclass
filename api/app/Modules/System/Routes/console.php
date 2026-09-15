<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('files:purge-trash')
    ->daily()
    ->withoutOverlapping();
