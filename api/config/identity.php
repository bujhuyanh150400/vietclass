<?php

return [
    'token_name' => env('IDENTITY_TOKEN_NAME', 'api-client'),
    'token_expiration_days' => (int) env('IDENTITY_TOKEN_EXPIRATION_DAYS', 30),
    'remember_token_expiration_days' => (int) env('IDENTITY_REMEMBER_TOKEN_EXPIRATION_DAYS', 120),
];
