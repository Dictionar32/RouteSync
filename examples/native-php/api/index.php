<?php
// Native PHP API example
// Compatible with RouteSync

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = trim($uri, '/');
$segments = explode('/', $uri);

function jsonResponse($data, $message = null, $success = true, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Simple router
match(true) {
    $method === 'GET' && $segments[0] === 'users' && !isset($segments[1]) =>
        jsonResponse([
            ['id' => 1, 'name' => 'Lutfi'],
            ['id' => 2, 'name' => 'Raihan']
        ]),

    $method === 'GET' && $segments[0] === 'users' && isset($segments[1]) =>
        jsonResponse(['id' => (int)$segments[1], 'name' => 'User Detail']),

    $method === 'POST' && $segments[0] === 'users' =>
        jsonResponse(['id' => 3, 'name' => 'Created'], 'User created', true, 201),

    default => jsonResponse(null, 'Not Found', false, 404)
};
