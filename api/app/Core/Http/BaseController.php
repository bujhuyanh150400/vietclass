<?php

namespace App\Core\Http;

use App\Core\Http\Concerns\HandleApi;
use Illuminate\Routing\Controller;

abstract class BaseController extends Controller
{
    use HandleApi;
}
