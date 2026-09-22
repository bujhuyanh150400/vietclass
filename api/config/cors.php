<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type'],
    'exposed_headers' => [],
    // Browsers preflight Bearer-authenticated JSON requests; caching the answer keeps
    // that to one extra round trip per request shape rather than one per call.
    'max_age' => (int) env('CORS_MAX_AGE', 600),
    'supports_credentials' => false,
];
