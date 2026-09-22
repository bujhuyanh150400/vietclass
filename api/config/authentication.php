<?php

return [
    'token_name' => env('AUTH_TOKEN_NAME', 'api-client'),
    'token_expiration_days' => (int) env('AUTH_TOKEN_EXPIRATION_DAYS', 30),
    'remember_token_expiration_days' => (int) env('AUTH_REMEMBER_TOKEN_EXPIRATION_DAYS', 120),
];
