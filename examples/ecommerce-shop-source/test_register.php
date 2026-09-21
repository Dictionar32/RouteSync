<?php
$request = Request::create('/api/register', 'POST', [], [], [], [
    'CONTENT_TYPE' => 'application/json',
    'HTTP_ACCEPT' => 'application/json',
], json_encode([
    'name' => 'Tinker User',
    'email' => 'tinker@example.com',
    'password' => 'password123',
    'password_confirmation' => 'password123'
]));
$response = app()->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
